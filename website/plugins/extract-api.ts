import { execSync } from "node:child_process";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

function runExtract(rootDir: string) {
  execSync("tsx scripts/extract-api.ts", {
    cwd: rootDir,
    stdio: "inherit",
  });
}

export function extractApi(): Plugin {
  let rootDir: string;
  let packageSrcDir: string;

  return {
    name: "extract-api",
    apply: "serve",

    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      packageSrcDir = path.resolve(rootDir, "../package/src");
      try {
        runExtract(rootDir);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[extract-api] initial extraction failed:\n  ${msg}`);
      }
    },

    configureServer(server) {
      server.watcher.add(packageSrcDir);
      server.watcher.on("change", (changedPath) => {
        if (path.resolve(changedPath).startsWith(path.resolve(packageSrcDir))) {
          try {
            runExtract(rootDir);
            server.ws.send({ type: "full-reload" });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[extract-api] re-extraction failed:\n  ${msg}`);
          }
        }
      });
    },
  };
}
