import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { codeToHtml } from "shiki";
import type { Plugin, ResolvedConfig } from "vite";
import { stripTypes } from "../src/lib/strip-types.ts";
import { formatSource } from "./format.ts";

interface HighlightedExample {
  tsHtml: string;
  jsHtml: string;
  language: string;
}

async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code.trimEnd(), {
    lang,
    theme: "github-dark-default",
  });
}

async function processExample(
  file: string,
  examplesDir: string,
  rootDir: string,
): Promise<HighlightedExample> {
  const filePath = path.join(examplesDir, file);
  const tsRaw = readFileSync(filePath, "utf-8");
  const jsRaw = stripTypes(tsRaw, file);
  const isTsx = file.endsWith(".tsx");
  const tsLang = isTsx ? "tsx" : "ts";
  const jsLang = isTsx ? "jsx" : "js";

  const tsFormatted = formatSource(tsRaw, filePath, rootDir);
  const jsFormatted = formatSource(
    jsRaw,
    filePath.replace(/\.tsx?$/, jsLang === "jsx" ? ".jsx" : ".js"),
    rootDir,
  );

  const [tsHtml, jsHtml] = await Promise.all([
    highlight(tsFormatted, tsLang),
    highlight(jsFormatted, jsLang),
  ]);

  return { tsHtml, jsHtml, language: tsLang };
}

function outputPath(examplesDir: string, file: string): string {
  const base = file.replace(/\.tsx?$/, "");
  return path.join(examplesDir, `${base}.highlighted.gen.json`);
}

async function generateAll(examplesDir: string, rootDir: string) {
  const files = readdirSync(examplesDir).filter(
    (f) => /\.[jt]sx?$/.test(f) && !f.includes(".gen."),
  );

  await Promise.all(
    files.map(async (file) => {
      const data = await processExample(file, examplesDir, rootDir);
      writeFileSync(outputPath(examplesDir, file), JSON.stringify(data));
    }),
  );

  console.log(
    `[highlight-examples] generated ${files.length} highlighted example(s)`,
  );
}

async function generateOne(file: string, examplesDir: string, rootDir: string) {
  const data = await processExample(file, examplesDir, rootDir);
  writeFileSync(outputPath(examplesDir, file), JSON.stringify(data));
  console.log(`[highlight-examples] regenerated ${file}`);
}

export function highlightExamples(): Plugin {
  let rootDir: string;
  let examplesDir: string;

  return {
    name: "highlight-examples",

    async configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      examplesDir = path.join(rootDir, "src/examples");
      try {
        await generateAll(examplesDir, rootDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(
          `[highlight-examples] initial generation failed:\n  ${msg}`,
        );
      }
    },

    configureServer(server) {
      server.watcher.add(examplesDir);
      server.watcher.on("change", async (changedPath) => {
        const resolved = path.resolve(changedPath);
        if (
          !resolved.startsWith(path.resolve(examplesDir)) ||
          resolved.includes(".gen.")
        ) {
          return;
        }
        const file = path.basename(resolved);
        try {
          await generateOne(file, examplesDir, rootDir);
          server.ws.send({ type: "full-reload" });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(
            `[highlight-examples] failed to regenerate ${file}:\n  ${msg}`,
          );
        }
      });
    },
  };
}
