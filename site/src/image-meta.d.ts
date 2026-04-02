// Image imports return metadata via vite-imagetools (overrides vite/client)
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

// ── Vite client types (non-image subset of vite/client.d.ts) ──

type CSSModuleClasses = { readonly [key: string]: string };
declare module "*.module.css" {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module "*.module.scss" {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module "*.css" {}
declare module "*.scss" {}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.woff2" {
  const src: string;
  export default src;
}
declare module "*.woff" {
  const src: string;
  export default src;
}

declare module "*?raw" {
  const src: string;
  export default src;
}
declare module "*?url" {
  const src: string;
  export default src;
}
declare module "*?worker" {
  const workerConstructor: {
    new (options?: { name?: string }): Worker;
  };
  export default workerConstructor;
}

declare interface VitePreloadErrorEvent extends Event {
  payload: Error;
}
declare interface WindowEventMap {
  "vite:preloadError": VitePreloadErrorEvent;
}
