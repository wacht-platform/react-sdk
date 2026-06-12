/// <reference types="vite/client" />

interface ViteTypeOptions {
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.css?inline" {
  const css: string;
  export default css;
}