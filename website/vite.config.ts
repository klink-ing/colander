import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";
import { breakpoints } from "./plugins/breakpoints.ts";
import { fluid } from "./plugins/fluid.ts";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
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
    viteReact(),
  ],
});

export default config;
