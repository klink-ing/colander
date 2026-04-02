// Vite import.meta types (import.meta.hot, import.meta.env, etc.)
// We reference this directly instead of vite/client because vite/client
// declares image imports as `string`, which conflicts with vite-imagetools
// returning `{ src, width, height, format }` metadata objects.
/// <reference types="vite/types/importMeta" />

// Image imports return metadata via vite-imagetools
interface ImageMeta {
  src: string;
  width: number;
  height: number;
  format: string;
}

declare module "*.png" {
  const meta: ImageMeta;
  export default meta;
}
declare module "*.jpg" {
  const meta: ImageMeta;
  export default meta;
}
declare module "*.jpeg" {
  const meta: ImageMeta;
  export default meta;
}
declare module "*.webp" {
  const meta: ImageMeta;
  export default meta;
}
declare module "*.avif" {
  const meta: ImageMeta;
  export default meta;
}
declare module "*.gif" {
  const meta: ImageMeta;
  export default meta;
}

// Vite query-parameter imports used in this project.
// Add new declarations here if TypeScript errors on asset imports.
declare module "*?url" {
  const src: string;
  export default src;
}
