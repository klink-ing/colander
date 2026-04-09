import path from "node:path";
import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";
import { breakpoints } from "./plugins/breakpoints.ts";
import { fluid } from "./plugins/fluid.ts";

const config = defineConfig({
  resolve: {
    alias: {
      colander: path.resolve(__dirname, "../package/src/index.ts"),
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
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
