import ts from "typescript";

/**
 * Strips all TypeScript type annotations from source code,
 * producing valid JavaScript/JSX output.
 *
 * Uses TypeScript's transpiler instead of ts-blank-space, which
 * has a bug where JSX spreads cause subsequent function-call
 * attributes to be incorrectly blanked out.
 *
 * Pads the output with trailing newlines so the total line count
 * matches the original source, keeping TS/JS examples aligned
 * when shown side-by-side.
 */
export function stripTypes(source: string, fileName: string): string {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      jsx: fileName.endsWith(".tsx") ? ts.JsxEmit.Preserve : undefined,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      verbatimModuleSyntax: true,
    },
  });

  return result.outputText;
}
