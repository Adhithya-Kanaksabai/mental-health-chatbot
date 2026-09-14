import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";

import {
  createSSEParser,
  dataFromFrame,
  encodeEvent,
} from "../../shared/protocol";
import type { ChatRequest, StreamEvent } from "../../shared/protocol";
import { resourcesFor, regionFor } from "./safety/resources";

dotenv.config();

// Deliberately API_PORT, not PORT. Launchers (including the desktop app's Run
// button via .claude/launch.json) set PORT for the frontend dev server, and every
// child process inherits it - which made this API bind the frontend's port 5173
// and left nothing listening on 5000.
const PORT = Number(process.env.API_PORT ?? 5000);
// Overridable so the pipeline can be tested against a local fake upstream, and
// so Phase 5 can point it at a local llama.cpp / Ollama OpenAI-compatible server.
const OPENROUTER_URL =
  process.env.OPENROUTER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "openai/gpt-4o";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

// The README asked for OPENAI_API_KEY while the code read OPENROUTER_API_KEY.
// Accept both, and refuse to boot silently without one.
const API_KEY = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error(
    "Missing API key. Set OPENROUTER_API_KEY in server/.env (see README)."
  );
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Visiting the API port in a browser should explain itself rather than show
// Express's bare "Cannot GET /".
app.get("/", (_req, res) => {
  res.json({
    service: "mental-health-chatbot API",
    note: "This is the backend. The app itself runs at the ui URL below.",
    ui: APP_URL,
    endpoints: [
      "GET  /api/health",
      "GET  /api/crisis-resources?locale=en-IN",
      "POST /api/chat",
    ],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, defaultModel: DEFAULT_MODEL });
});

app.get("/api/crisis-resources", (req, res) => {
  const hint = {
    timeZone: typeof req.query.timeZone === "string" ? req.query.timeZone : undefined,
    languages:
      typeof req.query.languages === "string"
        ? req.query.languages.split(",").filter(Boolean)
        : undefined,
  };
  res.json({ region: regionFor(hint), resources: resourcesFor(hint) });
});

/**
 * Turn an upstream HTTP status into something the reader can act on. "Upstream
 * error (401)" tells nobody what to do; naming the likely cause does.
 */
function describeUpstream(status: number): { message: string; retryable: boolean } {
  if (status === 401 || status === 403) {
    return {
      message:
        "The AI provider rejected the API key. Check OPENROUTER_API_KEY in server/.env - it may be expired or revoked.",
      retryable: false,
    };
  }
  if (status === 402) {
    return {
      message:
        "This OpenRouter account has no credit for the selected model. Add credit at openrouter.ai, or set DEFAULT_MODEL in server/.env to a free model (an ID ending in :free).",
      retryable: false,
    };
  }
  if (status === 404) {
    return {
      message: "The AI provider does not recognise the configured model name.",
      retryable: false,
    };
  }
  if (status === 429) {
    return { message: "Rate limited by the AI provider. Try again shortly.", retryable: true };
  }
  if (status >= 500) {
    return { message: "The AI provider is having trouble. Try again shortly.", retryable: true };
  }
  return { message: `The AI provider returned an unexpected error (${status}).`, retryable: false };
}

app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, model, locale } = req.body as ChatRequest;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const requestId = randomUUID();
  const chosenModel = model ?? DEFAULT_MODEL;
  const startedAt = Date.now();
  let ttftMs = -1;
  let promptTokens = 0;
  let completionTokens = 0;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: StreamEvent) => {
    res.write(encodeEvent(event));
  };

  // Abort the upstream request if the browser hangs up, so a cancelled
  // conversation stops burning tokens.
  //
  // This must hang off the RESPONSE, not the request: req "close" fires as soon
  // as the request body has been fully read (which express.json() does
  // immediately), so aborting there kills every stream right after the first
  // event. res "close" fires when the connection actually goes away, and
  // writableEnded distinguishes a normal finish from a real disconnect.
  const upstream = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) upstream.abort();
  });

  try {
    send({ type: "meta", requestId, model: chosenModel });

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: upstream.signal,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "mental-health-chatbot",
      },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      console.error(`[${requestId}] upstream ${response.status}: ${detail}`);
      const described = describeUpstream(response.status);
      send({ type: "error", ...described });
      send({ type: "done" });
      res.end();
      return;
    }

    const parser = createSSEParser();
    const decoder = new TextDecoder("utf-8");
    const reader = response.body.getReader();
    let upstreamDone = false;

    // Tracked so a stream that ends without an answer is reported, never silent.
    let frames = 0;
    let contentChunks = 0;
    let reasoningChunks = 0;
    let lastFinishReason: string | null = null;
    let upstreamError: string | null = null;

    while (!upstreamDone) {
      const { value, done } = await reader.read();
      if (done) break;

      // stream:true so multi-byte characters split across chunks survive.
      for (const frame of parser(decoder.decode(value, { stream: true }))) {
        const data = dataFromFrame(frame);
        if (data === null) continue;
        if (data === "[DONE]") {
          upstreamDone = true;
          break;
        }

        let payload: any;
        try {
          payload = JSON.parse(data);
        } catch {
          // OpenRouter interleaves non-JSON keep-alive comments; skip quietly.
          continue;
        }
        frames++;

        // A provider can fail AFTER the 200 status has been sent, in which case
        // the failure only exists inside the stream.
        if (payload.error) {
          upstreamError =
            typeof payload.error === "string"
              ? payload.error
              : payload.error.message ?? "The AI provider reported an error mid-response.";
          console.error(`[${requestId}] in-stream error:`, JSON.stringify(payload.error));
          upstreamDone = true;
          break;
        }

        const choice = payload.choices?.[0];
        if (choice?.finish_reason) lastFinishReason = choice.finish_reason;

        const text: string | undefined = choice?.delta?.content;
        if (text) {
          contentChunks++;
          if (ttftMs < 0) ttftMs = Date.now() - startedAt;
          send({ type: "delta", text });
        } else if (choice?.delta?.reasoning) {
          // Reasoning models think before answering. That text is deliberately
          // not shown to the user; it is only counted, to explain empty replies.
          reasoningChunks++;
        }

        if (payload.usage) {
          promptTokens = payload.usage.prompt_tokens ?? 0;
          completionTokens = payload.usage.completion_tokens ?? 0;
        }
      }
    }

    if (upstreamError || lastFinishReason === "error") {
      send({
        type: "error",
        message: upstreamError ?? "The AI provider reported an error mid-response.",
        retryable: true,
      });
    } else if (contentChunks === 0) {
      // A successful-looking stream that carried no answer. Ending quietly here
      // is exactly the silent empty reply this protocol exists to prevent.
      console.error(
        `[${requestId}] empty reply from ${chosenModel}: frames=${frames} reasoningChunks=${reasoningChunks} finish=${lastFinishReason}`
      );
      send({
        type: "error",
        message:
          lastFinishReason === "length"
            ? "The model ran out of room before it could answer. Try again, or use a different model."
            : "The model returned an empty response. Try again, or use a different model.",
        retryable: true,
      });
    }

    send({
      type: "usage",
      promptTokens,
      completionTokens,
      // Priced in Phase 1 via the model registry. Null, not a guessed number.
      costUsd: null,
      ttftMs: ttftMs < 0 ? 0 : ttftMs,
      totalMs: Date.now() - startedAt,
    });
    send({ type: "done" });
    res.end();
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";

    if (aborted) {
      // Client hung up; the socket is already gone.
      if (!res.writableEnded) res.end();
      return;
    }

    console.error(`[${requestId}] stream failed:`, err);

    if (!res.writableEnded) {
      send({
        type: "error",
        message: "The assistant could not be reached. Please try again.",
        retryable: true,
      });
      send({ type: "done" });
      res.end();
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `No route ${req.method} ${req.path}` });
});

// Express 5 passes a listen failure to this callback (it attaches the callback to
// the server's "error" event), so the error must be checked here - otherwise a
// port clash would print "listening" and then leave nothing running.
app.listen(PORT, (err?: Error) => {
  if (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use - most likely another copy of this app is still running. Stop it, or set API_PORT in server/.env.`
      );
    } else {
      console.error("API failed to start:", err);
    }
    process.exit(1);
  }

  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Default model: ${DEFAULT_MODEL}`);
});
