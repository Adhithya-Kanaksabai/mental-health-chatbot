import { createSSEParser, dataFromFrame } from "@shared/protocol";
import type {
  ChatRequest,
  CrisisResource,
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

/** Crisis resources for the viewer's region, resolved server-side. */
export async function fetchCrisisResources(
  locale: string
): Promise<CrisisResource[]> {
  try {
    const response = await fetch(
      `${API_BASE}/api/crisis-resources?locale=${encodeURIComponent(locale)}`
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { resources: CrisisResource[] };
    return body.resources ?? [];
  } catch {
    return [];
  }
}
