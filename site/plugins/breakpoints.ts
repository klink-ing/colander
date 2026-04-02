import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

interface BreakpointsConfig {
  start: number;
  end: number;
  step: number;
  remPerUnit: number;
}

function generateCSS(configPath: string, outputPath: string, rootDir: string) {
  const raw = readFileSync(configPath, "utf-8");
  const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const config: BreakpointsConfig = JSON.parse(stripped);
  const { start, end, step, remPerUnit } = config;

  const lines: string[] = ["@theme {", "  --breakpoint-*: initial;"];

  for (let n = start; n <= end; n = Math.round((n + step) * 10) / 10) {
    const value = n * remPerUnit;
    const isWhole = n % 1 === 0;
    const name = isWhole ? `bp-${n}` : `bp-${Math.floor(n)}\\.${(n % 1) * 10}`;
    lines.push(`  --breakpoint-${name}: ${value}rem;`);
  }

  lines.push("}\n");
  writeFileSync(outputPath, lines.join("\n"));
  const oxfmtConfig = path.resolve(rootDir, "../.oxfmtrc.json");
  execSync(`npx oxfmt -c ${oxfmtConfig} ${outputPath} --write`, {
    stdio: "inherit",
  });
  console.log("[breakpoints] generated breakpoints.gen.css");
}

export function breakpoints(): Plugin {
  let rootDir: string;
  let configPath: string;
  let outputPath: string;

  return {
    name: "breakpoints",

    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      configPath = path.join(rootDir, "src/breakpoints.config.jsonc");
      outputPath = path.join(rootDir, "src/breakpoints.gen.css");
      try {
        generateCSS(configPath, outputPath, rootDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[breakpoints] error in ${configPath}:\n  ${msg}`);
      }
    },

    configureServer(server) {
      server.watcher.add(configPath);
      server.watcher.on("change", (changedPath) => {
        if (path.resolve(changedPath) === path.resolve(configPath)) {
          try {
            generateCSS(configPath, outputPath, rootDir);
            server.ws.send({ type: "full-reload" });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[breakpoints] error in ${configPath}:\n  ${msg}`);
          }
        }
      });
    },
  };
}
