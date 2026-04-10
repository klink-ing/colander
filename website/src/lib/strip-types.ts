import tsBlankSpace from "ts-blank-space";

/**
 * Strips all TypeScript type annotations from source code,
 * producing valid JavaScript/JSX output while preserving
 * the original spacing and line structure.
 */
export function stripTypes(source: string, _fileName: string): string {
  return tsBlankSpace(source)
    .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
    .trim();
}
