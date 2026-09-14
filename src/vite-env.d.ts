/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of a separately hosted API. Unset in dev: /api is proxied to Express by Vite. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
