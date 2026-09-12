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
import { resourcesForLocale } from "./safety/resources";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, defaultModel: DEFAULT_MODEL });
});

app.get("/api/crisis-resources", (req, res) => {
  const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
  res.json({ resources: resourcesForLocale(locale) });
});

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
      send({
        type: "error",
        message: `Upstream error (${response.status}).`,
        retryable: response.status >= 500 || response.status === 429,
      });
      send({ type: "done" });
      res.end();
      return;
    }

    const parser = createSSEParser();
    const decoder = new TextDecoder("utf-8");
    const reader = response.body.getReader();
    let upstreamDone = false;

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

        const text: string | undefined = payload.choices?.[0]?.delta?.content;
        if (text) {
          if (ttftMs < 0) ttftMs = Date.now() - startedAt;
          send({ type: "delta", text });
        }

        if (payload.usage) {
          promptTokens = payload.usage.prompt_tokens ?? 0;
          completionTokens = payload.usage.completion_tokens ?? 0;
        }
      }
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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Default model: ${DEFAULT_MODEL}`);
});
