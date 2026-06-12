import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
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
