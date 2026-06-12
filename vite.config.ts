import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    // size-limit fixtures import build output (../dist) that only exists
    // after a pack, so they can't be type-checked from a clean tree
    ignorePatterns: ["package/size-limit/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    printWidth: 80,
    ignorePatterns: ["**/routeTree.gen.ts"],
    sortPackageJson: true,
    sortImports: {
      partitionByNewline: true,
      newlinesBetween: false,
    },
    overrides: [
      {
        files: ["website/**/*.{ts,tsx}"],
        options: {
          sortTailwindcss: {
            stylesheet: "./website/src/styles.css",
            functions: ["cn"],
          },
        },
      },
    ],
  },
  run: {
    cache: true,
    tasks: {},
  },
  staged: {
    "*": "vp check --fix",
  },
});
