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
