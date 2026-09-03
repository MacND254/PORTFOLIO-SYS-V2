/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  /** Full backend service URL, e.g. https://portfolio-backend-xxx.up.railway.app — required for Railway OAuth */
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
