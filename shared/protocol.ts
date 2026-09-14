/**
 * The wire contract between the Express server and the React client.
 *
 * Both sides import this file. That is the point: the previous implementation
 * had the server emitting raw OpenRouter chunks while the client read a
 * `token` field that never existed, so the stream silently produced nothing.
 * With a single shared discriminated union, that class of bug does not compile.
 */

export type RiskLevel = "none" | "concern" | "crisis";

export type ContactMethod = "call" | "text" | "chat";

export interface CrisisResource {
  /** Display name of the service, e.g. "Tele-MANAS". */
  name: string;
  /** The number to dial, the shortcode to text, or the URL to open. */
  contact: string;
  method: ContactMethod;
  /** Short human-readable qualifier, e.g. "24/7, free, 20 languages". */
  detail?: string;
  /** Official source, shown as a link and used to re-verify the number. */
  url?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Signals used to pick region-appropriate crisis resources.
 *
 * timeZone is the stronger signal and is preferred: navigator.language reports
 * the browser's UI language, not the user's location - a machine in India
 * routinely reports "en-US".
 */
export interface LocaleHint {
  /** IANA zone from Intl.DateTimeFormat().resolvedOptions().timeZone. */
  timeZone?: string;
  /** navigator.languages, most-preferred first. */
  languages?: string[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Omitted means "server default". Becomes a real choice in Phase 1. */
  model?: string;
  locale?: LocaleHint;
}

export type StreamEvent =
  | { type: "meta"; requestId: string; model: string }
  | { type: "delta"; text: string }
  | { type: "safety"; level: RiskLevel; resources?: CrisisResource[] }
  | {
      type: "usage";
      promptTokens: number;
      completionTokens: number;
      /** null when the model has no price entry yet - never fake a number. */
      costUsd: number | null;
      ttftMs: number;
      totalMs: number;
    }
  | { type: "error"; message: string; retryable: boolean }
  | { type: "done" };

/** Serialise one event as a single SSE frame. */
export function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Incremental SSE framer.
 *
 * A network chunk can end mid-frame, so anything after the last `\n\n` is
 * retained until the next push. The old client cleared its buffer after every
 * read, which dropped exactly those split frames.
 */
export function createSSEParser(): (chunk: string) => string[] {
  let buffer = "";

  return function push(chunk: string): string[] {
    buffer += chunk.replace(/\r\n/g, "\n");

    const frames: string[] = [];
    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      frames.push(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }

    return frames;
  };
}

/**
 * Join the `data:` lines of one SSE frame. Comment lines (`:` keep-alives) and
 * other fields are ignored. Returns null for a frame carrying no data.
 */
export function dataFromFrame(frame: string): string | null {
  const data = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  return data.length > 0 ? data : null;
}
