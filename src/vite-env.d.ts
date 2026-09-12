/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Express API. Defaults to http://localhost:5000. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
