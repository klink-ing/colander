import path from "node:path";

/** Resolve `colander` → `./dist/index.js` so esbuild can find the built output. */
function withAlias(config) {
  config.alias = { colander: path.resolve("dist/index.js") };
  return config;
}

export default [
  {
    name: "library only",
    path: "dist/index.js",
    limit: "12 kB",
  },
  {
    name: "unstyled (full polyfill)",
    path: "size-limit/unstyled.tsx",
    import: "{ DatePicker }",
    limit: "56 kB",
  },
  {
    name: "unstyled (mini polyfill)",
    path: "size-limit/unstyled-mini.tsx",
    import: "{ DatePicker }",
    limit: "16 kB",
  },
  {
    name: "unstyled + drag ranges",
    path: "size-limit/unstyled-drag.tsx",
    import: "{ DatePicker }",
    limit: "60 kB",
    modifyEsbuildConfig(config) {
      withAlias(config);
      return config;
    },
  },
  {
    name: "styled + drag ranges",
    path: "dev/examples/styled-date-picker.tsx",
    import: "{ StyledDatePicker }",
    limit: "65 kB",
    modifyEsbuildConfig(config) {
      withAlias(config);
      return config;
    },
  },
];
