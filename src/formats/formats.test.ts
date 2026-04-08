import * as root from "colander";
import { describe, it, expect } from "vitest";

const formatModules = import.meta.glob<Record<string, unknown>>(
  ["./*.ts", "!./*.test.ts"],
  { eager: true },
);

describe("format subpath exports", () => {
  const rootKeys = Object.keys(root).sort();

  for (const [path, mod] of Object.entries(formatModules)) {
    const name = path.replace(/^\.\//, "").replace(/\.ts$/, "");

    it(`${name} exports the same names as the root index`, () => {
      expect(Object.keys(mod).sort()).toEqual(rootKeys);
    });
  }
});
