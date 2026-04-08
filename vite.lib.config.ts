import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// Discover generated format entry files
const formatsDir = path.resolve(import.meta.dirname, "src/formats");
const formatEntries: Record<string, string> = {};
if (fs.existsSync(formatsDir)) {
  for (const file of fs.readdirSync(formatsDir)) {
    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const name = file.replace(/\.tsx?$/, "");
      formatEntries[`formats/${name}`] = path.resolve(formatsDir, file);
    }
  }
}

export default defineConfig({
  plugins: [
    react({ jsxRuntime: "automatic" }),
    ...(process.env.VISUALIZE
      ? [visualizer({ filename: "stats.html", gzipSize: true })]
      : []),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(import.meta.dirname, "src/index.ts"),
        ...formatEntries,
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        /^@base-ui\/react/,
        /@js-temporal\/polyfill/,
      ],
    },
    target: "es2020",
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
  },
});
