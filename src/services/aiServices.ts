import { createSSEParser, dataFromFrame } from "@shared/protocol";
import type {
  ChatRequest,
  CrisisResource,
  LocaleHint,
  RiskLevel,
  StreamEvent,
} from "@shared/protocol";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

export interface StreamHandlers {
  onMeta?: (requestId: string, model: string) => void;
  onDelta: (text: string) => void;
  onSafety?: (level: RiskLevel, resources?: CrisisResource[]) => void;
  onUsage?: (usage: Extract<StreamEvent, { type: "usage" }>) => void;
  onError?: (message: string, retryable: boolean) => void;
  onDone?: () => void;
}

/**
 * Stream one assistant reply.
 *
 * Every frame is a `StreamEvent` from the shared protocol, so the client and
 * server cannot silently disagree about the payload shape the way they did
 * before (the server sent OpenRouter's chunk, the client read `.token`).
 */
export async function streamChat(
  request: ChatRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok || !response.body) {
      handlers.onError?.(
        `Server responded ${response.status}.`,
        response.status >= 500
      );
      handlers.onDone?.();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const parser = createSSEParser();

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      // stream:true keeps multi-byte characters intact across chunk edges.
      for (const frame of parser(decoder.decode(value, { stream: true }))) {
        const data = dataFromFrame(frame);
        if (data === null) continue;

        let event: StreamEvent;
        try {
          event = JSON.parse(data) as StreamEvent;
        } catch {
          continue;
        }

        switch (event.type) {
          case "meta":
            handlers.onMeta?.(event.requestId, event.model);
            break;
          case "delta":
            handlers.onDelta(event.text);
            break;
          case "safety":
            handlers.onSafety?.(event.level, event.resources);
            break;
          case "usage":
            handlers.onUsage?.(event);
            break;
          case "error":
            handlers.onError?.(event.message, event.retryable);
            break;
          case "done":
            handlers.onDone?.();
            return;
        }
      }
    }

    handlers.onDone?.();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      handlers.onDone?.();
      return;
    }

    handlers.onError?.(
      "Could not reach the server. Is it running on port 5000?",
      true
    );
    handlers.onDone?.();
  }
}

/**
 * What this browser can tell us about where the user is.
 *
 * Time zone is listed first because it is the reliable signal: navigator
 * .language is the UI language, and a machine in India commonly reports
 * "en-US", which would show US-only crisis numbers to an Indian user.
 */
export function localeHint(): LocaleHint {
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }

  return {
    timeZone,
    languages: navigator.languages
      ? Array.from(navigator.languages)
      : [navigator.language],
  };
}

export interface CrisisContext {
  /** "IN", "US", or "INTL" when nothing matched. */
  region: string;
  resources: CrisisResource[];
}

/** Crisis resources plus the region they were resolved for. */
export async function fetchCrisisContext(
  hint: LocaleHint
): Promise<CrisisContext> {
  try {
    const params = new URLSearchParams();
    if (hint.timeZone) params.set("timeZone", hint.timeZone);
    if (hint.languages?.length) params.set("languages", hint.languages.join(","));

    const response = await fetch(`${API_BASE}/api/crisis-resources?${params}`);
    if (!response.ok) return { region: "INTL", resources: [] };
    const body = (await response.json()) as CrisisContext;
    return { region: body.region ?? "INTL", resources: body.resources ?? [] };
  } catch {
    return { region: "INTL", resources: [] };
  }
}

/** Crisis resources for the viewer's region, resolved server-side. */
export async function fetchCrisisResources(
  hint: LocaleHint
): Promise<CrisisResource[]> {
  return (await fetchCrisisContext(hint)).resources;
}
