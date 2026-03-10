import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => format === "es" ? "index.js" : "index.cjs",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        /^@base-ui\/react/,
      ],
    },
    target: "es2020",
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
  },
});
