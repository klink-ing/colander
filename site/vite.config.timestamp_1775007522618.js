// vite.config.ts
import path from "node:path";
import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
var config = defineConfig({
  resolve: {
    alias: {
      colander: path.resolve(__dirname, "../src/index.ts")
    }
  },
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact()
  ]
});
var vite_config_default = config;
export {
  vite_config_default as default
};
