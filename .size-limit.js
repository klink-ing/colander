import path from "node:path";

const IGNORE_REACT = ["react", "react-dom", "react/jsx-runtime"];

/** Resolve `base-ui-cal` → `./dist/index.js` so esbuild can find the built output. */
function withAlias(config) {
  config.alias = { "base-ui-cal": path.resolve("dist/index.js") };
  return config;
}

export default [
  {
    path: "dist/index.js",
    limit: "12 kB",
  },
  {
    name: "unstyled (full polyfill)",
    path: "size-limit-unstyled.tsx",
    import: "{ DatePicker }",
    limit: "56 kB",
  },
  {
    name: "unstyled (full polyfill, no react)",
    path: "size-limit-unstyled.tsx",
    import: "{ DatePicker }",
    limit: "60 kB",
    modifyEsbuildConfig(config) {
      config.external = IGNORE_REACT;
      return config;
    },
  },
  {
    name: "unstyled (mini polyfill)",
    path: "size-limit-unstyled-mini.tsx",
    import: "{ DatePicker }",
    limit: "16 kB",
    modifyEsbuildConfig(config) {
      config.external = IGNORE_REACT;
      return config;
    },
  },
  {
    name: "styled + drag ranges",
    path: "dev/examples/styled-date-picker.tsx",
    import: "{ StyledDatePicker }",
    limit: "65 kB",
    modifyEsbuildConfig(config) {
      config.external = [...IGNORE_REACT, "lucide-react"];
      withAlias(config);
      return config;
    },
  },
];
