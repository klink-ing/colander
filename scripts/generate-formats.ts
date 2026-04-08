/**
 * Generates pre-typed format entry files under src/formats/.
 *
 * For each ValueFormat member (parsed from src/types.ts), this script creates
 * a .tsx file that re-exports all generic components from the main library
 * with the type parameter narrowed to that specific format.
 *
 * Usage: npx tsx scripts/generate-formats.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const INDEX_PATH = path.join(SRC, "index.ts");
const TYPES_PATH = path.join(SRC, "types.ts");
const FORMATS_DIR = path.join(SRC, "formats");

// Formats to skip (don't make sense for a calendar component)
const SKIP_FORMATS = new Set(["PlainTime"]);

// Exports to exclude from generated files
const SKIP_EXPORTS = new Set(["createDatePicker"]);

// ---------------------------------------------------------------------------
// 1. Parse DateValueObject from types.ts to extract format discriminants
// ---------------------------------------------------------------------------

function parseFormats(): string[] {
  const source = fs.readFileSync(TYPES_PATH, "utf-8");
  const sf = ts.createSourceFile(
    TYPES_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const formats: string[] = [];

  ts.forEachChild(sf, (node) => {
    if (
      !ts.isTypeAliasDeclaration(node) ||
      node.name.text !== "DateValueObject"
    )
      return;

    const type = node.type;
    if (!ts.isUnionTypeNode(type)) return;

    for (const member of type.types) {
      if (!ts.isTypeLiteralNode(member)) continue;
      for (const prop of member.members) {
        if (
          ts.isPropertySignature(prop) &&
          prop.name &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === "format" &&
          prop.type &&
          ts.isLiteralTypeNode(prop.type) &&
          ts.isStringLiteral(prop.type.literal)
        ) {
          formats.push(prop.type.literal.text);
        }
      }
    }
  });

  return formats.filter((f) => !SKIP_FORMATS.has(f));
}

// ---------------------------------------------------------------------------
// 2. Parse index.ts to find value-exported symbols that are generic over
//    ValueFormat. Uses the TypeScript type checker.
// ---------------------------------------------------------------------------

interface GenericExport {
  name: string;
  /** The module specifier in the re-export (e.g. "./grid") */
  sourceModule: string;
}

/**
 * Check if any call signature of a type has a type parameter constrained to
 * ValueFormat (directly or as part of a union).
 */
function hasValueFormatTypeParam(
  checker: ts.TypeChecker,
  type: ts.Type,
): boolean {
  for (const sig of type.getCallSignatures()) {
    const typeParams = sig.getTypeParameters();
    if (!typeParams) continue;
    for (const tp of typeParams) {
      const constraint = tp.getConstraint();
      if (!constraint) continue;
      const str = checker.typeToString(constraint);
      if (str === "ValueFormat" || str.includes("ValueFormat")) return true;
    }
  }
  return false;
}

function findGenericExports(): GenericExport[] {
  const configPath = path.join(ROOT, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    ROOT,
  );

  const program = ts.createProgram([INDEX_PATH], {
    ...parsed.options,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const indexSf = program.getSourceFile(INDEX_PATH);
  if (!indexSf) throw new Error("Could not load src/index.ts");

  // Build a map of export name → source module from the AST
  const exportSourceMap = new Map<string, string>();
  ts.forEachChild(indexSf, (node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause) &&
      !node.isTypeOnly
    ) {
      const mod = node.moduleSpecifier.text;
      for (const el of node.exportClause.elements) {
        if (!el.isTypeOnly) {
          exportSourceMap.set(el.name.text, mod);
        }
      }
    }
  });

  const indexSymbol = checker.getSymbolAtLocation(indexSf);
  if (!indexSymbol) throw new Error("No symbol for index.ts");

  const moduleExports = checker.getExportsOfModule(indexSymbol);
  const result: GenericExport[] = [];

  for (const sym of moduleExports) {
    if (SKIP_EXPORTS.has(sym.name)) continue;

    const sourceModule = exportSourceMap.get(sym.name);
    if (!sourceModule) continue;

    // Resolve aliases
    const resolved =
      sym.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(sym)
        : sym;

    const decls = resolved.getDeclarations();
    if (!decls || decls.length === 0) continue;

    // Get the type of the symbol and check for generic call signatures
    const type = checker.getTypeOfSymbolAtLocation(resolved, decls[0]);

    // Check if the type has call signatures with a ValueFormat type param.
    // Also check the type-to-string as a fallback for components typed via
    // `as <F extends ValueFormat>(...) => ...` where the checker may not
    // expose type params directly.
    if (hasValueFormatTypeParam(checker, type)) {
      result.push({ name: sym.name, sourceModule });
      continue;
    }

    const typeStr = checker.typeToString(
      type,
      undefined,
      ts.TypeFormatFlags.NoTruncation,
    );
    if (typeStr.includes("F extends ValueFormat")) {
      result.push({ name: sym.name, sourceModule });
      continue;
    }

    // For function+namespace hybrids (e.g. MonthView with .Root), the
    // call signature type param may be hidden. Check all declarations for
    // a type parameter with a ValueFormat constraint.
    let foundViaDecl = false;
    for (const decl of decls) {
      // Check function declarations and function expressions
      const typeParams =
        ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl)
          ? decl.typeParameters
          : undefined;
      if (typeParams) {
        for (const tp of typeParams) {
          if (tp.constraint) {
            const cType = checker.getTypeAtLocation(tp.constraint);
            const cStr = checker.typeToString(cType);
            if (cStr === "ValueFormat" || cStr.includes("ValueFormat")) {
              foundViaDecl = true;
              break;
            }
          }
        }
      }
      if (foundViaDecl) break;

      // Last resort: check the source text of the declaration
      const src = decl.getSourceFile();
      const declText = src.text.slice(decl.pos, decl.end).slice(0, 200);
      if (/\bextends\s+ValueFormat\b/.test(declText)) {
        foundViaDecl = true;
        break;
      }
    }
    if (foundViaDecl) {
      result.push({ name: sym.name, sourceModule });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// 3. Generate format entry files
// ---------------------------------------------------------------------------

function formatToKebab(format: string): string {
  return format.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateFormatFile(
  format: string,
  genericExports: GenericExport[],
): string {
  // Group exports by source module for clean imports
  const byModule = new Map<string, string[]>();
  for (const exp of genericExports) {
    // Rewrite import paths: ./grid → ../grid (formats/ is one level deeper)
    const importPath = exp.sourceModule.replace(/^\.\//, "../");
    const list = byModule.get(importPath) ?? [];
    list.push(exp.name);
    byModule.set(importPath, list);
  }

  const lines: string[] = [];
  lines.push(
    "// @generated by scripts/generate-formats.ts — do not edit manually",
    "",
  );

  // Import statements
  const sortedModules = [...byModule.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [mod, names] of sortedModules) {
    const sorted = [...names].sort();
    if (sorted.length <= 3) {
      lines.push(`import { ${sorted.join(", ")} } from "${mod}";`);
    } else {
      lines.push(`import {`);
      for (const name of sorted) {
        lines.push(`  ${name},`);
      }
      lines.push(`} from "${mod}";`);
    }
  }

  lines.push("");
  lines.push(`type F = "${format}";`);
  lines.push("");

  // Instantiation expressions + re-exports
  for (const exp of genericExports) {
    lines.push(`const _${exp.name} = ${exp.name}<F>;`);
  }

  lines.push("");
  lines.push("export {");
  for (const exp of genericExports) {
    lines.push(`  _${exp.name} as ${exp.name},`);
  }
  lines.push("};");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const formats = parseFormats();
const genericExports = findGenericExports();

console.log(
  `Found ${genericExports.length} generic exports: ${genericExports.map((e) => e.name).join(", ")}`,
);
console.log(`Generating format entries for: ${formats.join(", ")}`);

fs.mkdirSync(FORMATS_DIR, { recursive: true });

// Clean existing generated files
for (const file of fs.readdirSync(FORMATS_DIR)) {
  if (file.endsWith(".tsx")) {
    const content = fs.readFileSync(path.join(FORMATS_DIR, file), "utf-8");
    if (content.startsWith("// @generated")) {
      fs.unlinkSync(path.join(FORMATS_DIR, file));
    }
  }
}

for (const format of formats) {
  const kebab = formatToKebab(format);
  const content = generateFormatFile(format, genericExports);
  const filePath = path.join(FORMATS_DIR, `${kebab}.tsx`);
  fs.writeFileSync(filePath, content);
  console.log(`  wrote src/formats/${kebab}.tsx`);
}

console.log("Done.");
