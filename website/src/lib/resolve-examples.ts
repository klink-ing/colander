import * as fs from "node:fs";
import * as path from "node:path";
import { format } from "prettier";
import { codeToHtml } from "shiki";
import { stripTypes } from "./strip-types";

/**
 * Walks a Markdoc renderable tree and injects formatted, syntax-highlighted
 * `tsHtml` and `jsHtml` into any `ExampleBlock` nodes.
 */
export async function resolveExamples(tree: unknown): Promise<unknown> {
  if (tree == null || typeof tree !== "object") return tree;
  if (Array.isArray(tree)) {
    await Promise.all(
      tree.map((item, i) =>
        resolveExamples(item).then((r) => {
          tree[i] = r;
        }),
      ),
    );
    return tree;
  }

  const node = tree as Record<string, unknown>;

  if (node.name === "ExampleBlock" && node.attributes) {
    const attrs = node.attributes as Record<string, unknown>;
    const file = attrs.file as string | undefined;

    if (file && !attrs.tsHtml) {
      const examplesDir = path.resolve(process.cwd(), "src/examples");
      const filePath = path.resolve(examplesDir, file);

      try {
        const tsRaw = fs.readFileSync(filePath, "utf-8");
        const jsRaw = stripTypes(tsRaw, file);
        const isTsx = file.endsWith(".tsx");
        const tsLang = isTsx ? "tsx" : "ts";
        const jsLang = isTsx ? "jsx" : "js";

        const [tsFormatted, jsFormatted] = await Promise.all([
          formatCode(tsRaw, file),
          formatCode(jsRaw, file.replace(/\.tsx?$/, jsLang === "jsx" ? ".jsx" : ".js")),
        ]);

        const [tsHtml, jsHtml] = await Promise.all([
          highlight(tsFormatted, tsLang),
          highlight(jsFormatted, jsLang),
        ]);

        attrs.tsHtml = tsHtml;
        attrs.jsHtml = jsHtml;
        attrs.language = tsLang;
      } catch (err) {
        const msg = `// Error: Could not process ${file}`;
        attrs.tsHtml = `<pre><code>${msg}</code></pre>`;
        attrs.jsHtml = `<pre><code>${msg}</code></pre>`;
        attrs.language = "ts";
        console.error(`Failed to resolve example ${file}:`, err);
      }
    }
  }

  if (node.children) {
    await resolveExamples(node.children);
  }

  return node;
}

async function formatCode(source: string, fileName: string): Promise<string> {
  try {
    return await format(source, {
      parser: fileName.match(/\.[jt]sx$/) ? "babel-ts" : "typescript",
      semi: false,
      singleQuote: true,
      trailingComma: "all",
      printWidth: 80,
    });
  } catch {
    return source;
  }
}

async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code.trimEnd(), {
    lang,
    theme: "github-dark-default",
  });
}
