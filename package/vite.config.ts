import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@klinking/colander": path.resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  plugins: [react({ jsxRuntime: "automatic" })],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  pack: {
    entry: {
      index: "./src/index.ts",
      "formats/plain-date": "./src/formats/plain-date.ts",
      "formats/plain-date-time": "./src/formats/plain-date-time.ts",
      "formats/plain-month-day": "./src/formats/plain-month-day.ts",
      "formats/plain-year-month": "./src/formats/plain-year-month.ts",
      "formats/zoned-date-time": "./src/formats/zoned-date-time.ts",
      "formats/object": "./src/formats/object.ts",
      "formats/date": "./src/formats/date.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
  },
  run: {
    tasks: {
      "generate-formats": {
        command: "tsx scripts/generate-formats.ts",
      },
      build: {
        command: "vp run generate-formats && vp pack",
      },
      test: {
        command: "vp test run",
      },
    },
  },
});
