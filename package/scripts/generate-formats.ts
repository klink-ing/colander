/**
 * Generates pre-typed format entry files under src/formats/.
 *
 * For each ValueFormat member (parsed from src/types.ts), this script creates
 * a .ts file that re-exports everything from index.ts with generic components
 * and types narrowed to the specific format via instantiation expressions.
 *
 * Usage: npx tsx scripts/generate-formats.ts
 */

import { execSync } from "node:child_process";
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
// 2. Detect generic exports (values and types) via TypeScript type checker
// ---------------------------------------------------------------------------

function isGenericOverValueFormat(
  checker: ts.TypeChecker,
  sym: ts.Symbol,
): boolean {
  const resolved =
    sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;

  const decls = resolved.getDeclarations();
  if (!decls || decls.length === 0) return false;

  // For type aliases: check if they have a type parameter with ValueFormat constraint
  for (const decl of decls) {
    if (ts.isTypeAliasDeclaration(decl) || ts.isInterfaceDeclaration(decl)) {
      const typeParams = decl.typeParameters;
      if (typeParams) {
        for (const tp of typeParams) {
          if (tp.constraint) {
            const cType = checker.getTypeAtLocation(tp.constraint);
            const cStr = checker.typeToString(cType);
            if (cStr === "ValueFormat" || cStr.includes("ValueFormat"))
              return true;
          }
        }
      }
    }
  }

  // For value exports: check call signatures
  const type = checker.getTypeOfSymbolAtLocation(resolved, decls[0]);
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

  // Fallback: check type string
  const typeStr = checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation,
  );
  if (typeStr.includes("F extends ValueFormat")) return true;

  // Last resort: check declaration source text
  for (const decl of decls) {
    const src = decl.getSourceFile();
    const declText = src.text.slice(decl.pos, decl.end).slice(0, 300);
    if (/\bextends\s+ValueFormat\b/.test(declText)) return true;
  }

  return false;
}

function findGenericSymbols(): {
  genericValues: Set<string>;
  genericTypes: Set<string>;
} {
  const configPath = path.resolve(ROOT, "..", "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ROOT);

  const program = ts.createProgram([INDEX_PATH], {
    ...parsed.options,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const indexSf = program.getSourceFile(INDEX_PATH);
  if (!indexSf) throw new Error("Could not load src/index.ts");

  const indexSymbol = checker.getSymbolAtLocation(indexSf);
  if (!indexSymbol) throw new Error("No symbol for index.ts");

  const moduleExports = checker.getExportsOfModule(indexSymbol);
  const genericValues = new Set<string>();
  const genericTypes = new Set<string>();

  for (const sym of moduleExports) {
    if (!isGenericOverValueFormat(checker, sym)) continue;

    const resolved =
      sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;

    // Determine if this is a type-only or value export
    const isTypeOnly =
      resolved.flags & ts.SymbolFlags.TypeAlias &&
      !(resolved.flags & ts.SymbolFlags.Value);

    if (isTypeOnly) {
      genericTypes.add(sym.name);
    } else {
      genericValues.add(sym.name);
    }
  }

  return { genericValues, genericTypes };
}

// ---------------------------------------------------------------------------
// 3. Parse index.ts and generate format files by transforming each export
// ---------------------------------------------------------------------------

interface ExportInfo {
  names: string[];
  module: string;
  isTypeOnly: boolean;
}

/** Parse index.ts AST to extract structured export info. */
function parseIndexExports(): ExportInfo[] {
  const source = fs.readFileSync(INDEX_PATH, "utf-8");
  const sf = ts.createSourceFile(
    INDEX_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const result: ExportInfo[] = [];

  ts.forEachChild(sf, (node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      const mod = node.moduleSpecifier.text;
      const names = node.exportClause.elements.map((el) => el.name.text);
      result.push({
        names,
        module: mod,
        isTypeOnly: node.isTypeOnly,
      });
    }
  });

  return result;
}

function formatToKebab(format: string): string {
  return format.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateFormatFile(
  format: string,
  exports: ExportInfo[],
  genericValues: Set<string>,
  genericTypes: Set<string>,
): string {
  const lines: string[] = [];
  lines.push(
    "// @generated by scripts/generate-formats.ts — do not edit manually",
    `type F = "${format}";`,
    "",
  );

  for (const exp of exports) {
    const mod = exp.module.replace(/^\.\//, "../");

    if (exp.isTypeOnly) {
      // Type exports: split into generic and non-generic
      const generic = exp.names.filter((n) => genericTypes.has(n));
      const plain = exp.names.filter((n) => !genericTypes.has(n));

      if (generic.length > 0) {
        // Import generic types aliased, then re-export with F applied
        const imports = generic.map((n) => `${n} as _${n}`).join(", ");
        lines.push(`import type { ${imports} } from "${mod}";`);
        for (const n of generic) {
          lines.push(`export type ${n} = _${n}<F>;`);
        }
      }
      if (plain.length > 0) {
        lines.push(`export type { ${plain.join(", ")} } from "${mod}";`);
      }
    } else {
      // Value exports: split into generic and non-generic
      const generic = exp.names.filter((n) => genericValues.has(n));
      const plain = exp.names.filter((n) => !genericValues.has(n));

      if (generic.length > 0) {
        const imports = generic.map((n) => `${n} as _${n}`).join(", ");
        lines.push(`import { ${imports} } from "${mod}";`);
        for (const n of generic) {
          lines.push(`const ${n} = _${n}<F>;`);
        }
        lines.push(`export { ${generic.join(", ")} };`);
      }
      if (plain.length > 0) {
        lines.push(`export { ${plain.join(", ")} } from "${mod}";`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const formats = parseFormats();
const { genericValues, genericTypes } = findGenericSymbols();
const exports = parseIndexExports();

console.log(
  `Found ${genericValues.size} generic values: ${[...genericValues].sort().join(", ")}`,
);
console.log(
  `Found ${genericTypes.size} generic types: ${[...genericTypes].sort().join(", ")}`,
);
console.log(`Generating format entries for: ${formats.join(", ")}`);

fs.mkdirSync(FORMATS_DIR, { recursive: true });

// Clean existing generated files
for (const file of fs.readdirSync(FORMATS_DIR)) {
  if (file.endsWith(".tsx") || file.endsWith(".ts")) {
    const filePath = path.join(FORMATS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.startsWith("// @generated")) {
      fs.unlinkSync(filePath);
    }
  }
}

for (const format of formats) {
  const kebab = formatToKebab(format);
  const content = generateFormatFile(
    format,
    exports,
    genericValues,
    genericTypes,
  );
  const filePath = path.join(FORMATS_DIR, `${kebab}.ts`);
  fs.writeFileSync(filePath, content);
  console.log(`  wrote src/formats/${kebab}.ts`);
}

// Run linting and formatting on generated files using vp's bundled toolchain
// so output matches `vp fmt` / `vp check --fix` behavior everywhere.
console.log("Running linter and formatter...");
try {
  execSync(`npx vp check --fix ${FORMATS_DIR}`, { cwd: ROOT, stdio: "pipe" });
} catch {
  // vp check --fix may exit non-zero for unfixable issues; that's OK
}

console.log("Done.");
