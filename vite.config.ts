import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    cache: true,
    tasks: {},
  },
  staged: {
    "*": "vp check --fix",
  },
});
