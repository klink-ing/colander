import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { parseFrontmatter, parseMarkdoc } from "../src/lib/markdoc.ts";

// ---------------------------------------------------------------------------
// AST → JSX source-code conversion
// ---------------------------------------------------------------------------

interface TagNode {
  $$mdtype: "Tag";
  name: string;
  attributes: Record<string, unknown>;
  children: AstNode[];
}

type AstNode = string | TagNode | null | AstNode[];

/** Escape special JSX characters in text content. */
function escapeJsxText(text: string): string {
  if (!/[{}<>]/.test(text)) return text;
  return `{${JSON.stringify(text)}}`;
}

/** Render a single attribute value as JSX source. */
function renderAttrValue(value: unknown): string {
  if (typeof value === "string") {
    if (/["{}<>]/.test(value)) return `{${JSON.stringify(value)}}`;
    return `"${value}"`;
  }
  if (typeof value === "number") return `{${value}}`;
  if (typeof value === "boolean") return value ? "" : `{false}`;
  return `{${JSON.stringify(value)}}`;
}

/** Render an attribute list as JSX source. */
function renderAttrs(
  attrs: Record<string, unknown>,
  isHtmlElement: boolean,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;

    // Markdoc uses "class"; JSX needs "className" for HTML elements
    const propName = key === "class" && isHtmlElement ? "className" : key;

    const rendered = renderAttrValue(value);
    // Boolean true → bare attribute
    if (typeof value === "boolean" && value) {
      parts.push(propName);
    } else {
      parts.push(`${propName}=${rendered}`);
    }
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

/** Recursively convert a Markdoc AST node to JSX source code. */
function renderToJsx(node: AstNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return escapeJsxText(node);
  if (Array.isArray(node)) return node.map(renderToJsx).join("\n");

  const { name, attributes = {}, children = [] } = node;
  const isHtml = name[0] === name[0].toLowerCase();
  const tag = isHtml ? name : `Tags.${name}`;
  const attrStr = renderAttrs(attributes, isHtml);
  const childStr = children.map(renderToJsx).join("");

  if (!childStr) return `<${tag}${attrStr} />`;
  return `<${tag}${attrStr}>${childStr}</${tag}>`;
}

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------

function outputPath(outDir: string, file: string): string {
  const slug = file.replace(/\.md$/, "");
  return path.join(outDir, `${slug}.doc.gen.tsx`);
}

function processDoc(file: string, contentDir: string): string {
  const raw = readFileSync(path.join(contentDir, file), "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);
  const transformed = parseMarkdoc(content);

  // Round-trip through JSON to get plain objects (strips Markdoc Tag instances)
  const ast: AstNode = JSON.parse(JSON.stringify(transformed));

  const jsxBody = renderToJsx(ast);

  const lines = [
    "// Auto-generated — do not edit",
    'import * as Tags from "#/components/markdoc-tags";',
    "",
    `export const frontmatter = ${JSON.stringify(frontmatter)};`,
    "",
    "export default function DocContent() {",
    "  return (",
    "    <>",
    `      ${jsxBody}`,
    "    </>",
    "  );",
    "}",
    "",
  ];

  return lines.join("\n");
}

/** Convert a slug like "getting-started" to PascalCase like "GettingStarted". */
function slugToPascal(slug: string): string {
  return slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function generateIndex(contentDir: string, outDir: string) {
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const slugs = files.map((f) => f.replace(/\.md$/, "")).sort();

  const lines: string[] = [
    "// Auto-generated — do not edit",
    'import type { ComponentType } from "react";',
    'import type { DocFrontmatter } from "#/lib/markdoc";',
    "",
  ];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const varName = slugToPascal(slug);
    lines.push(
      `import ${varName}, { frontmatter as fm${i} } from "./${slug}.doc.gen";`,
    );
  }

  lines.push("");
  lines.push("export interface DocEntry {");
  lines.push("  Component: ComponentType;");
  lines.push("  frontmatter: DocFrontmatter;");
  lines.push("}");
  lines.push("");
  lines.push("export const docs: Record<string, DocEntry> = {");

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const varName = slugToPascal(slug);
    lines.push(`  "${slug}": { Component: ${varName}, frontmatter: fm${i} },`);
  }

  lines.push("};");
  lines.push("");

  writeFileSync(path.join(outDir, "index.gen.ts"), lines.join("\n"));
}

function generateAll(contentDir: string, outDir: string) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const source = processDoc(file, contentDir);
    writeFileSync(outputPath(outDir, file), source);
  }

  generateIndex(contentDir, outDir);
  console.log(`[generate-docs] generated ${files.length} doc(s)`);
}

function generateOne(file: string, contentDir: string, outDir: string) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const source = processDoc(file, contentDir);
  writeFileSync(outputPath(outDir, file), source);
  generateIndex(contentDir, outDir);
  console.log(`[generate-docs] regenerated ${file}`);
}

export function generateDocs(): Plugin {
  let contentDir: string;
  let outDir: string;

  return {
    name: "generate-docs",

    configResolved(config: ResolvedConfig) {
      contentDir = path.join(config.root, "content/docs");
      outDir = path.join(config.root, "src/docs-data");
      try {
        generateAll(contentDir, outDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[generate-docs] initial generation failed:\n  ${msg}`);
      }
    },

    configureServer(server) {
      // Watch the content directory (outside src/) for markdown changes.
      // Writing updated .tsx files into src/docs-data/ is enough — Vite's
      // built-in HMR detects those writes and reloads the affected modules.
      server.watcher.add(contentDir);

      const handleChange = (changedPath: string) => {
        const resolved = path.resolve(changedPath);
        if (
          !resolved.startsWith(path.resolve(contentDir)) ||
          !resolved.endsWith(".md")
        ) {
          return;
        }
        const file = path.basename(resolved);
        try {
          generateOne(file, contentDir, outDir);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[generate-docs] failed to regenerate ${file}:\n  ${msg}`,
          );
        }
      };

      server.watcher.on("change", handleChange);
      server.watcher.on("add", handleChange);
      server.watcher.on("unlink", (changedPath) => {
        const resolved = path.resolve(changedPath);
        if (
          !resolved.startsWith(path.resolve(contentDir)) ||
          !resolved.endsWith(".md")
        ) {
          return;
        }
        try {
          generateIndex(contentDir, outDir);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[generate-docs] failed to regenerate index:\n  ${msg}`,
          );
        }
      });
    },
  };
}
