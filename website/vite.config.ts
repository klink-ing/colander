import path from "node:path";
import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";
import { breakpoints } from "./plugins/breakpoints.ts";
import { fluid } from "./plugins/fluid.ts";

const isBuild = process.argv.includes("build");

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@klinking/colander": path.resolve(
        __dirname,
        "../package/src/index.ts",
      ),
    },
  },
  build: {
    rollupOptions: {
      external: ["typescript"],
    },
  },
  plugins: [
    breakpoints(),
    fluid(),
    imagetools({
      include: "src/assets/images/**/*",
      defaultDirectives: () => new URLSearchParams({ as: "metadata" }),
    }),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    ...(isBuild ? [netlify()] : []),
    viteReact(),
  ],
});

export default config;
