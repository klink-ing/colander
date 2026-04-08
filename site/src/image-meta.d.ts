// Vite import.meta types (import.meta.hot, import.meta.env, etc.)
// We reference this directly instead of vite/client because vite/client
// declares image imports as `string`, which conflicts with vite-imagetools
// returning `{ src, width, height, format }` metadata objects.
/// <reference types="vite/types/importMeta" />

// Vite query-parameter imports
declare module "*?url" {
  const src: string;
  export default src;
}

// vite-imagetools: all images under #/assets/images/ return ImageMeta
// (with or without directives) because vite.config.ts sets
// `defaultDirectives: { as: "metadata" }`.
// TypeScript only allows one `*` per `declare module`, so scoping to
// the path alias is the only way to handle arbitrary query params.
interface ImageMeta {
  src: string;
  width: number;
  height: number;
  format: string;
}

declare module "#/assets/images/*" {
  const meta: ImageMeta;
  export default meta;
}
