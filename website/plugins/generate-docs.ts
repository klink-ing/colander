import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import type { DocFrontmatter } from "../src/lib/markdoc.ts";
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
  if (Array.isArray(node)) return node.map(renderToJsx).join("");

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

interface ProcessedDoc {
  slug: string;
  frontmatter: DocFrontmatter;
  source: string;
}

function processRoute(file: string, contentDir: string): ProcessedDoc {
  const slug = file.replace(/\.md$/, "");
  const raw = readFileSync(path.join(contentDir, file), "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);
  const transformed = parseMarkdoc(content);

  // Round-trip through JSON to get plain objects (strips Markdoc Tag instances)
  const ast: AstNode = JSON.parse(JSON.stringify(transformed));
  const jsxBody = renderToJsx(ast);

  const source = [
    `// Auto-generated from ${file} — do not edit`,
    'import { createFileRoute } from "@tanstack/react-router";',
    'import * as Tags from "#/components/markdoc-tags";',
    'import { PROJECT_NAME } from "#/config";',
    "",
    `const frontmatter = ${JSON.stringify(frontmatter)};`,
    "",
    `export const Route = createFileRoute("/docs/${slug}")({`,
    "  loader: () => ({ frontmatter }),",
    "  head: () => ({",
    "    meta: [",
    "      { title: `${frontmatter.title} - ${PROJECT_NAME}` },",
    "      ...(frontmatter.description",
    '        ? [{ name: "description", content: frontmatter.description }]',
    "        : []),",
    "    ],",
    "  }),",
    "  component: DocContent,",
    "});",
    "",
    "function DocContent() {",
    "  return (",
    `    ${jsxBody}`,
    "  );",
    "}",
    "",
  ].join("\n");

  return { slug, frontmatter, source };
}

function writeNavManifest(
  entries: { slug: string; frontmatter: DocFrontmatter }[],
  outDir: string,
) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const sorted = [...entries].sort(
    (a, b) => a.frontmatter.order - b.frontmatter.order,
  );

  const lines = [
    "// Auto-generated — do not edit",
    'import type { DocFrontmatter } from "#/lib/markdoc";',
    "",
    "export const docEntries: { slug: string; frontmatter: DocFrontmatter }[] = " +
      JSON.stringify(sorted, null, 2) +
      ";",
    "",
  ];

  writeFileSync(path.join(outDir, "nav.gen.ts"), lines.join("\n"));
}

function generateAll(contentDir: string, routeDir: string, dataDir: string) {
  if (!existsSync(routeDir)) {
    mkdirSync(routeDir, { recursive: true });
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const entries: { slug: string; frontmatter: DocFrontmatter }[] = [];

  for (const file of files) {
    const { slug, frontmatter, source } = processRoute(file, contentDir);
    writeFileSync(path.join(routeDir, `${slug}.tsx`), source);
    entries.push({ slug, frontmatter });
  }

  writeNavManifest(entries, dataDir);
  console.log(`[generate-docs] generated ${files.length} doc route(s)`);
}

function generateOne(
  file: string,
  contentDir: string,
  routeDir: string,
  dataDir: string,
) {
  if (!existsSync(routeDir)) {
    mkdirSync(routeDir, { recursive: true });
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const entries: { slug: string; frontmatter: DocFrontmatter }[] = [];

  const { slug, frontmatter, source } = processRoute(file, contentDir);
  writeFileSync(path.join(routeDir, `${slug}.tsx`), source);

  for (const f of files) {
    if (f === file) {
      entries.push({ slug, frontmatter });
    } else {
      const s = f.replace(/\.md$/, "");
      const raw = readFileSync(path.join(contentDir, f), "utf-8");
      const { frontmatter: fm } = parseFrontmatter(raw);
      entries.push({ slug: s, frontmatter: fm });
    }
  }

  writeNavManifest(entries, dataDir);
  console.log(`[generate-docs] regenerated ${file}`);
}

export function generateDocs(): Plugin {
  let contentDir: string;
  let routeDir: string;
  let dataDir: string;

  return {
    name: "generate-docs",

    configResolved(config: ResolvedConfig) {
      contentDir = path.join(config.root, "content/docs");
      routeDir = path.join(config.root, "src/routes/docs");
      dataDir = path.join(config.root, "src/docs-data");
      try {
        generateAll(contentDir, routeDir, dataDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[generate-docs] initial generation failed:\n  ${msg}`);
      }
    },

    configureServer(server) {
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
          generateOne(file, contentDir, routeDir, dataDir);
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
          const slug = path.basename(resolved).replace(/\.md$/, "");
          const routeFile = path.join(routeDir, `${slug}.tsx`);
          if (existsSync(routeFile)) {
            unlinkSync(routeFile);
            console.log(`[generate-docs] removed ${slug}.tsx`);
          }
          generateAll(contentDir, routeDir, dataDir);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[generate-docs] failed to handle file removal:\n  ${msg}`,
          );
        }
      });
    },
  };
}
