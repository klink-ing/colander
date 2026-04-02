import path from "node:path";
import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { breakpoints } from "./plugins/breakpoints.ts";
import { fluid } from "./plugins/fluid.ts";

const config = defineConfig({
  resolve: {
    alias: {
      colander: path.resolve(__dirname, "../src/index.ts"),
    },
  },
  plugins: [
    breakpoints(),
    fluid(),
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
