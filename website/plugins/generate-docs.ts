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

function outputPath(outDir: string, file: string): string {
  const slug = file.replace(/\.md$/, "");
  return path.join(outDir, `${slug}.doc.gen.json`);
}

function processDoc(file: string, contentDir: string) {
  const raw = readFileSync(path.join(contentDir, file), "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);
  const transformed = parseMarkdoc(content);
  return {
    frontmatter,
    // Round-trip through JSON to strip non-serializable Markdoc properties
    content: JSON.parse(JSON.stringify(transformed)),
  };
}

function generateAll(contentDir: string, outDir: string) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const data = processDoc(file, contentDir);
    writeFileSync(outputPath(outDir, file), JSON.stringify(data));
  }

  console.log(`[generate-docs] generated ${files.length} doc(s)`);
}

function generateOne(file: string, contentDir: string, outDir: string) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const data = processDoc(file, contentDir);
  writeFileSync(outputPath(outDir, file), JSON.stringify(data));
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
      server.watcher.add(contentDir);
      server.watcher.on("change", (changedPath) => {
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
          server.ws.send({ type: "full-reload" });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[generate-docs] failed to regenerate ${file}:\n  ${msg}`,
          );
        }
      });
    },
  };
}
