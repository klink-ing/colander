import ts from "typescript";

/**
 * Strips all TypeScript type annotations from source code,
 * producing valid JavaScript/JSX output.
 */
export function stripTypes(source: string, fileName: string): string {
  const isTsx = fileName.endsWith(".tsx");

  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: isTsx ? ts.JsxEmit.Preserve : undefined,
      verbatimModuleSyntax: false,
      // Keep the code as close to the original as possible
      removeComments: false,
      pretty: true,
    },
    fileName,
  });

  return (
    result.outputText
      // Remove empty export {} that TS adds
      .replace(/^export \{\};\s*$/m, "")
      // Collapse multiple blank lines into one
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
