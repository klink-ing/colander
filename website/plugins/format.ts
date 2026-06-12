import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Format source in-memory with `vp fmt`.
 *
 * Runs from the monorepo root: `vp fmt` loads the nearest vite config, and
 * running it inside website/ trips on config-time imports. `filePath` is
 * resolved repo-relative before being passed as --stdin-filepath so
 * path-scoped overrides in the root fmt config (e.g. Tailwind class sorting
 * for website/**) apply the same way they would on a real file.
 */
export function formatSource(
  source: string,
  filePath: string,
  websiteRoot: string,
): string {
  const repoRoot = path.resolve(websiteRoot, "..");
  const relPath = path.isAbsolute(filePath)
    ? path.relative(repoRoot, filePath)
    : path.join("website", filePath);
  try {
    return execFileSync("npx", ["vp", "fmt", `--stdin-filepath=${relPath}`], {
      input: source,
      encoding: "utf-8",
      cwd: repoRoot,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `[fmt] formatter failed for ${relPath} (using unformatted source): ${msg}`,
    );
    return source;
  }
}
