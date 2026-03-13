import tseslint from "typescript-eslint";
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  {
    files: ["src/**/*.{ts,tsx}", "dev/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "tailwind-canonical-classes": tailwindCanonicalClasses,
    },
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        { cssPath: "./dev/index.css" },
      ],
    },
  },
];
