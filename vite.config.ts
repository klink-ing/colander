import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "base-ui-cal": path.resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  root: path.resolve(import.meta.dirname, "dev"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/dev"),
    emptyOutDir: true,
  },
});
