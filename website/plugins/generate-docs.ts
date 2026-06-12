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
import { formatSource } from "./format.ts";
import { type AstNode, renderToJsx } from "./render-jsx.ts";

const GENERATED_HEADER = "// Auto-generated";

let websiteRoot: string;

/** Format and write, skipping the write when the content is unchanged so
 * watchers (TanStack Router, Vite) don't see no-op mtime bumps. */
function writeFormatted(filePath: string, source: string) {
  const formatted = formatSource(source, filePath, websiteRoot);
  if (existsSync(filePath) && readFileSync(filePath, "utf-8") === formatted) {
    return;
  }
  writeFileSync(filePath, formatted);
}

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
    `${GENERATED_HEADER} from ${file} — do not edit`,
    'import { createFileRoute } from "@tanstack/react-router";',
    'import * as Tags from "#/components/markdoc";',
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

  const navEntries = sorted.map(({ slug, frontmatter }) => ({
    slug,
    frontmatter: {
      title: frontmatter.title,
      description: frontmatter.description,
      order: frontmatter.order,
      section: frontmatter.section,
    },
  }));

  const lines = [
    `${GENERATED_HEADER} — do not edit`,
    "",
    'import type { DocsNavEntry } from "#/components/DocsNav";',
    "",
    "export const docEntries = " +
      JSON.stringify(navEntries, null, 2) +
      " satisfies DocsNavEntry[];",
    "",
  ];

  writeFormatted(path.join(outDir, "nav.gen.ts"), lines.join("\n"));
}

/** Delete generated route files whose source .md no longer exists. Only
 * files carrying the generated header are touched, so hand-written routes
 * (index.tsx, api/) are safe. */
function pruneOrphans(routeDir: string, slugs: Set<string>) {
  for (const file of readdirSync(routeDir)) {
    if (!file.endsWith(".tsx") || slugs.has(file.replace(/\.tsx$/, ""))) {
      continue;
    }
    const filePath = path.join(routeDir, file);
    if (readFileSync(filePath, "utf-8").startsWith(GENERATED_HEADER)) {
      unlinkSync(filePath);
      console.log(`[generate-docs] removed orphaned ${file}`);
    }
  }
}

function generateAll(contentDir: string, routeDir: string, dataDir: string) {
  if (!existsSync(routeDir)) {
    mkdirSync(routeDir, { recursive: true });
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const entries: { slug: string; frontmatter: DocFrontmatter }[] = [];

  for (const file of files) {
    const { slug, frontmatter, source } = processRoute(file, contentDir);
    writeFormatted(path.join(routeDir, `${slug}.tsx`), source);
    entries.push({ slug, frontmatter });
  }

  pruneOrphans(routeDir, new Set(entries.map((e) => e.slug)));
  writeNavManifest(entries, dataDir);
  console.log(`[generate-docs] generated ${files.length} doc route(s)`);
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
      websiteRoot = config.root;
      try {
        generateAll(contentDir, routeDir, dataDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[generate-docs] initial generation failed:\n  ${msg}`);
      }
    },

    configureServer(server) {
      server.watcher.add(contentDir);

      // One regeneration path for every event: writeFormatted skips
      // unchanged outputs and pruneOrphans handles deletions, so a full
      // pass is both cheap and always consistent with a cold start.
      const handleEvent = (changedPath: string) => {
        const resolved = path.resolve(changedPath);
        if (
          !resolved.startsWith(path.resolve(contentDir)) ||
          !resolved.endsWith(".md")
        ) {
          return;
        }
        try {
          generateAll(contentDir, routeDir, dataDir);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[generate-docs] failed to regenerate after ${path.basename(resolved)} changed:\n  ${msg}`,
          );
        }
      };

      server.watcher.on("change", handleEvent);
      server.watcher.on("add", handleEvent);
      server.watcher.on("unlink", handleEvent);
    },
  };
}
