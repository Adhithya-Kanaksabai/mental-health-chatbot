# Mental Wellness Companion

A supportive-conversation and journaling app, built as a testbed for model-serving
engineering: a provider-agnostic routing layer, a safety evaluation harness, and
(in progress) a local quantized-inference path measured against that harness.

> **Not a clinical tool.** This app does not diagnose, treat, or provide medical
> advice, and it is not a substitute for professional care. The engineering
> interest here is the safety and serving architecture around the model, not any
> claim about therapeutic efficacy.

---

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | Shared wire protocol, working SSE streaming, locale-aware crisis resources | **done** |
| 1 | Provider abstraction, model registry, per-request model choice | planned |
| 2 | Crisis pre-classifier, boundary policy, deterministic escalation | planned |
| 3 | Safety eval harness + CI gate | planned |
| 4 | SQLite persistence, per-request tracing, metrics view | planned |
| 5 | Local inference (Ollama → llama.cpp), quantization/KV-cache benchmarks | planned |

---

## Architecture

```text
mental-health-chatbot/
├── shared/
│   └── protocol.ts             # Wire contract imported by BOTH client and server
├── src/                        # React frontend (Vite + TypeScript), served at :5173
│   ├── components/
│   ├── pages/                  # Home, Chat, Techniques, Journal, Resources
│   └── services/
│       └── aiServices.ts       # SSE client for the streaming protocol
├── server/                     # Express backend, served at :5000
│   └── src/
│       ├── index.ts            # Entry point; /api/chat, /api/health, /api/crisis-resources
│       └── safety/
│           └── resources.ts    # Region-specific crisis lines, each with its source URL
└── README.md
```

### The streaming protocol

`shared/protocol.ts` defines a single discriminated union, `StreamEvent`, that
both sides import:

```ts
type StreamEvent =
  | { type: "meta";   requestId: string; model: string }
  | { type: "delta";  text: string }
  | { type: "safety"; level: RiskLevel; resources?: CrisisResource[] }
  | { type: "usage";  promptTokens: number; completionTokens: number;
                      costUsd: number | null; ttftMs: number; totalMs: number }
  | { type: "error";  message: string; retryable: boolean }
  | { type: "done" };
```

This exists because the two sides previously disagreed silently: the server
forwarded OpenRouter's raw chunk shape while the client read a `token` field that
never existed, so the chat streamed nothing and failed without an error. Sharing
one type makes that class of mismatch a compile error.

The SSE framer in the same file retains any trailing partial frame between reads.
The previous client cleared its buffer after every chunk, so any event split
across a network boundary was dropped.

---

## Getting started

**Prerequisites:** Node.js 18+ (developed on 22), and an
[OpenRouter](https://openrouter.ai) API key.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env    # then put your real key in .env
npm run dev
```

`server/.env`:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
# Optional:
# DEFAULT_MODEL=openai/gpt-4o
# PORT=5000
# APP_URL=http://localhost:5173
# OPENROUTER_URL=...        # point at a local OpenAI-compatible server
```

The server refuses to start without an API key rather than failing later at
request time.

### 2. Frontend

In a second terminal, from the repository root:

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

---

## Crisis resources

Crisis lines are served from `server/src/safety/resources.ts`, keyed by region and
resolved from the browser's locale — they are **not** hardcoded in the UI, which
previously meant every user worldwide was shown US-only shortcodes that connect to
nothing abroad.

Currently covered: **IN** (Tele-MANAS, 14416) and **US** (988, Crisis Text Line
741741). Every other locale falls back to
[findahelpline.com](https://findahelpline.com) rather than inventing a number.

Each entry stores its official source URL. **Re-verify against that URL before
every release** — a stale helpline number is worse than none.

Last verified: 2026-09-12.

---

## Known issues

- `npm run lint` does not run. `eslint.config.js` is ESLint 9 flat config, but
  ESLint 8.57 is installed and `typescript-eslint`, `globals`, and `@eslint/js`
  are missing from `devDependencies`. Scheduled for the Phase 3 CI work.
- The system prompt is still sent from the client, so it is user-editable. It
  moves server-side in Phase 2, where the boundary policy is enforced.
- `costUsd` is always `null` until the Phase 1 model registry supplies pricing.
  It is deliberately null rather than a guessed figure.
