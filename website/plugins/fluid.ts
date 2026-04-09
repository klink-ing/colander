import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

const REM_PER_SPACING_UNIT = 0.25;

export interface FluidToken {
  min: number;
  max: number;
  minBp?: number;
  maxBp?: number;
}

export interface FluidConfig {
  minBp: number;
  maxBp: number;
  rem?: Record<string, FluidToken>;
  spacing?: Record<string, FluidToken>;
}

function round(n: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function parseJsonc(filePath: string) {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
}

function readRemPerUnit(rootDir: string): number {
  const bpConfigPath = path.join(rootDir, "src/breakpoints.config.jsonc");
  return parseJsonc(bpConfigPath).remPerUnit;
}

function loadConfig(configPath: string): FluidConfig {
  const json = execSync(
    `npx tsx -e "import c from '${configPath}'; console.log(JSON.stringify(c))"`,
    { encoding: "utf-8" },
  );
  return JSON.parse(json);
}

function clampLine(
  prefix: string,
  name: string,
  minRem: number,
  maxRem: number,
  minBpRem: number,
  maxBpRem: number,
) {
  const slope = (maxRem - minRem) / (maxBpRem - minBpRem);
  const intercept = minRem - slope * minBpRem;
  const slopeVw = round(slope * 100, 4);
  const interceptRem = round(intercept, 4);
  const sign = interceptRem < 0 ? "- " : "+ ";
  const absIntercept = Math.abs(interceptRem);

  return `  --fluid-${prefix}${name}: clamp(${round(minRem, 4)}rem, calc(${slopeVw}vw ${sign}${absIntercept}rem), ${round(maxRem, 4)}rem);`;
}

function generateCSS(configPath: string, outputPath: string, rootDir: string, remPerUnit: number) {
  const config = loadConfig(configPath);
  const lines: string[] = ["@theme {"];

  if (config.rem) {
    for (const [name, token] of Object.entries(config.rem)) {
      const minBpRem = (token.minBp ?? config.minBp) * remPerUnit;
      const maxBpRem = (token.maxBp ?? config.maxBp) * remPerUnit;
      lines.push(clampLine("", name, token.min, token.max, minBpRem, maxBpRem));
    }
  }

  if (config.spacing) {
    for (const [name, token] of Object.entries(config.spacing)) {
      const minRem = token.min * REM_PER_SPACING_UNIT;
      const maxRem = token.max * REM_PER_SPACING_UNIT;
      const minBpRem = (token.minBp ?? config.minBp) * remPerUnit;
      const maxBpRem = (token.maxBp ?? config.maxBp) * remPerUnit;
      lines.push(clampLine("space-", name, minRem, maxRem, minBpRem, maxBpRem));
    }
  }

  lines.push("}\n");
  writeFileSync(outputPath, lines.join("\n"));
  const oxfmtConfig = path.resolve(rootDir, "../.oxfmtrc.json");
  execSync(`npx oxfmt -c ${oxfmtConfig} ${outputPath} --write`, {
    stdio: "inherit",
  });
  console.log("[fluid] generated fluid.gen.css");
}

export function fluid(): Plugin {
  let rootDir: string;
  let configPath: string;
  let outputPath: string;

  return {
    name: "fluid",

    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      configPath = path.join(rootDir, "src/fluid.config.ts");
      outputPath = path.join(rootDir, "src/fluid.gen.css");
      try {
        const remPerUnit = readRemPerUnit(rootDir);
        generateCSS(configPath, outputPath, rootDir, remPerUnit);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[fluid] error in ${configPath}:\n  ${msg}`);
      }
    },

    configureServer(server) {
      server.watcher.add(configPath);
      server.watcher.on("change", (changedPath) => {
        if (path.resolve(changedPath) === path.resolve(configPath)) {
          try {
            const remPerUnit = readRemPerUnit(rootDir);
            generateCSS(configPath, outputPath, rootDir, remPerUnit);
            server.ws.send({ type: "full-reload" });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[fluid] error in ${configPath}:\n  ${msg}`);
          }
        }
      });
    },
  };
}
