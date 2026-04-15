/**
 * Regenerates doc component files from markdown source.
 * Used by CI to verify generated files are up-to-date.
 *
 * Usage: npx tsx scripts/generate-docs.ts
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAll } from "../plugins/generate-docs.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

generateAll(path.join(root, "content/docs"), path.join(root, "src/docs-data"));
