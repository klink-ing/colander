/**
 * Extracts API documentation from colander source code using ts-morph.
 * Parses all exports from src/index.ts and generates structured JSON
 * for the documentation site.
 *
 * Usage: npx tsx site/scripts/extract-api.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Project,
  type Type,
  type SourceFile,
  SyntaxKind,
  type Node,
} from "ts-morph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedProperty {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

interface ExtractedParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

interface ExtractedSymbol {
  name: string;
  kind:
    | "component"
    | "hook"
    | "type"
    | "interface"
    | "function"
    | "const"
    | "context";
  description: string;
  filePath: string;
  lineNumber: number;
  properties?: ExtractedProperty[];
  parameters?: ExtractedParam[];
  returnType?: string;
  members?: string[];
  typeText?: string;
  tags?: Record<string, string>;
  /** For types using useRender.ComponentProps<"element", State> */
  defaultElement?: string;
  /** The state type name passed to ComponentProps */
  stateType?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJSDocDescription(node: Node): string {
  const jsDocs = node.getChildrenOfKind(SyntaxKind.JSDoc);
  if (jsDocs.length === 0) return "";
  const doc = jsDocs[jsDocs.length - 1];
  return doc.getDescription().trim();
}

function getJSDocTags(node: Node): Record<string, string> {
  const jsDocs = node.getChildrenOfKind(SyntaxKind.JSDoc);
  if (jsDocs.length === 0) return {};
  const doc = jsDocs[jsDocs.length - 1];
  const tags: Record<string, string> = {};
  for (const tag of doc.getTags()) {
    const name = tag.getTagName();
    const text = tag.getCommentText()?.trim() ?? "";
    tags[name] = text;
  }
  return tags;
}

function resolveTypeText(type: Type): string {
  const text = type.getText(undefined, undefined);
  // Simplify long import paths
  return text
    .replace(/import\("[^"]+"\)\./g, "")
    .replace(/Temporal\.PlainDate/g, "PlainDate")
    .replace(/Temporal\.PlainDateTime/g, "PlainDateTime")
    .replace(/Temporal\.PlainYearMonth/g, "PlainYearMonth")
    .replace(/Temporal\.ZonedDateTime/g, "ZonedDateTime");
}

function extractPropertiesFromType(type: Type): ExtractedProperty[] {
  const properties: ExtractedProperty[] = [];
  for (const prop of type.getProperties()) {
    const declarations = prop.getDeclarations();
    const decl = declarations[0];
    if (!decl) continue;

    const propType = prop.getTypeAtLocation(decl);
    const description = decl ? getJSDocDescription(decl) : "";
    const tags = decl ? getJSDocTags(decl) : {};

    properties.push({
      name: prop.getName(),
      type: resolveTypeText(propType),
      description,
      optional: prop.isOptional(),
      defaultValue: tags["default"],
    });
  }
  return properties;
}

/**
 * Extract local-source properties from a type, handling intersections.
 * For intersections, tries to filter by member declaration location first.
 * If no local members are found (e.g. Omit<LocalType, ...>), falls back to
 * extracting from the full type and filtering by individual property declaration.
 */
function extractLocalProps(type: Type): ExtractedProperty[] {
  if (type.isIntersection()) {
    const seen = new Set<string>();
    const props: ExtractedProperty[] = [];
    for (const member of type.getIntersectionTypes()) {
      const memberSymbol = member.getSymbol() ?? member.getAliasSymbol();
      const memberDecl = memberSymbol?.getDeclarations()?.[0];
      const memberFile = memberDecl?.getSourceFile().getFilePath() ?? "";
      const isLocal = memberFile.includes("/src/");
      if (isLocal) {
        for (const p of extractPropertiesFromType(member)) {
          if (!seen.has(p.name)) {
            seen.add(p.name);
            props.push(p);
          }
        }
      }
    }
    if (props.length > 0) return props;

    // Fallback: extract all properties but filter by declaration source
    return extractPropertiesFromType(type).filter((p) => {
      const typeProp = type.getProperty(p.name);
      const propDecl = typeProp?.getDeclarations()?.[0];
      const propFile = propDecl?.getSourceFile().getFilePath() ?? "";
      return propFile.includes("/src/");
    });
  }

  if (type.isUnion()) {
    return extractPropertiesFromType(type);
  }

  if (type.isObject() && !type.isArray()) {
    return extractPropertiesFromType(type);
  }

  return [];
}

/** Extract props from a component's props type into the symbol. */
function extractComponentProps(
  propsType: Type,
  symbol: ExtractedSymbol,
  sourceFile?: SourceFile,
) {
  const propsTypeText = resolveTypeText(propsType);
  let cpMatch = propsTypeText.match(/ComponentProps<"(\w+)",\s*(\w+)/);

  // forwardRef wraps props in Omit<PropsType, "ref">, hiding ComponentProps.
  // Fall back to scanning the source file for the props type alias definition.
  if (!cpMatch && sourceFile) {
    const omitMatch = propsTypeText.match(/Omit<(\w+),/);
    if (omitMatch) {
      const fileText = sourceFile.getText();
      const aliasMatch = fileText.match(
        new RegExp(
          `type\\s+${omitMatch[1]}[^=]*=\\s*[^;]*ComponentProps<"(\\w+)",\\s*(\\w+)`,
        ),
      );
      if (aliasMatch) {
        cpMatch = aliasMatch;
      }
    }
  }

  if (cpMatch) {
    symbol.defaultElement = cpMatch[1];
    symbol.stateType = cpMatch[2];
  }

  const props = extractLocalProps(propsType);
  if (props.length > 0) {
    symbol.properties = props;
  }
}

function classifySymbol(
  name: string,
  declarations: Node[],
): ExtractedSymbol["kind"] {
  // Hooks start with "use"
  if (name.startsWith("use")) return "hook";

  // Context objects end with "Context"
  if (name.endsWith("Context")) return "context";

  for (const decl of declarations) {
    const kind = decl.getKind();
    // Type aliases and interfaces
    if (
      kind === SyntaxKind.TypeAliasDeclaration ||
      kind === SyntaxKind.InterfaceDeclaration
    ) {
      return "interface";
    }
    // Functions (PascalCase = component, camelCase = function)
    if (kind === SyntaxKind.FunctionDeclaration) {
      if (
        name[0] === name[0].toUpperCase() &&
        name[0] !== name[0].toLowerCase()
      ) {
        return "component";
      }
      return "function";
    }
    // Variable declarations (components, constants)
    if (kind === SyntaxKind.VariableDeclaration) {
      // Check if it's a component (starts with uppercase)
      if (
        name[0] === name[0].toUpperCase() &&
        name[0] !== name[0].toLowerCase()
      ) {
        return "component";
      }
      return "const";
    }
  }
  return "const";
}

// ---------------------------------------------------------------------------
// Main extraction
// ---------------------------------------------------------------------------

function extract(): ExtractedSymbol[] {
  const rootDir = path.resolve(__dirname, "../..");
  const indexPath = path.join(rootDir, "package/src/index.ts");

  console.log(`Loading project from ${rootDir}...`);

  const project = new Project({
    tsConfigFilePath: path.join(rootDir, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Add only the files we need
  project.addSourceFileAtPath(indexPath);
  project.resolveSourceFileDependencies();

  const indexFile = project.getSourceFileOrThrow(indexPath);
  const exportedDeclarations = indexFile.getExportedDeclarations();
  const symbols: ExtractedSymbol[] = [];

  console.log(`Found ${exportedDeclarations.size} exported symbols`);

  for (const [name, declarations] of exportedDeclarations) {
    const decl = declarations[0];
    if (!decl) continue;

    const sourceFile = decl.getSourceFile();
    const filePath = path.relative(rootDir, sourceFile.getFilePath());
    const lineNumber = decl.getStartLineNumber();
    const kind = classifySymbol(
      name,
      declarations.map((d) => d),
    );
    const description = getJSDocDescription(decl);
    const tags = getJSDocTags(decl);

    const symbol: ExtractedSymbol = {
      name,
      kind,
      description,
      filePath,
      lineNumber,
      tags: Object.keys(tags).length > 0 ? tags : undefined,
    };

    const declKind = decl.getKind();

    // Extract properties for interfaces and type aliases
    if (declKind === SyntaxKind.InterfaceDeclaration) {
      const iface = decl.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
      const type = iface.getType();
      symbol.properties = extractPropertiesFromType(type);
    } else if (declKind === SyntaxKind.TypeAliasDeclaration) {
      const alias = decl.asKindOrThrow(SyntaxKind.TypeAliasDeclaration);
      const type = alias.getType();
      symbol.typeText = resolveTypeText(type);

      // Extract defaultElement and stateType from useRender.ComponentProps<"el", State>
      const aliasText = alias.getText();
      const cpMatch = aliasText.match(
        /useRender\.ComponentProps<"(\w+)",\s*(\w+)/,
      );
      if (cpMatch) {
        symbol.defaultElement = cpMatch[1];
        symbol.stateType = cpMatch[2];
      }

      // Extract properties from object, intersection, or union types
      if (
        (type.isObject() || type.isIntersection() || type.isUnion()) &&
        !type.isArray()
      ) {
        const props = extractLocalProps(type);
        if (props.length > 0) {
          symbol.properties = props;
        }
      }

      // If it's a union, extract members
      if (type.isUnion()) {
        const members = type.getUnionTypes().map((t) => resolveTypeText(t));
        // Only store if they're simple literal types
        if (members.every((m) => m.length < 50)) {
          symbol.members = members;
        }
      }
    }

    // Extract parameters and return type for functions
    if (declKind === SyntaxKind.FunctionDeclaration) {
      const func = decl.asKindOrThrow(SyntaxKind.FunctionDeclaration);
      const returnType = func.getReturnType();
      symbol.returnType = resolveTypeText(returnType);

      if (kind === "component") {
        const propsParam = func.getParameters()[0];
        if (propsParam) {
          extractComponentProps(propsParam.getType(), symbol, sourceFile);
        }
      } else {
        // Non-component functions: extract raw parameters
        symbol.parameters = func.getParameters().map((p) => ({
          name: p.getName(),
          type: resolveTypeText(p.getType()),
          description: "",
          optional: p.isOptional(),
        }));
      }
    }

    // Extract props from variable-declared components (forwardRef, Object.assign, etc.)
    if (declKind === SyntaxKind.VariableDeclaration && kind === "component") {
      const varType = decl
        .asKindOrThrow(SyntaxKind.VariableDeclaration)
        .getType();

      // Find call signatures — either directly on the type, or on intersection members
      // (Object.assign returns an intersection where one member has the call signature)
      let callSigs = varType.getCallSignatures();
      if (callSigs.length === 0 && varType.isIntersection()) {
        for (const member of varType.getIntersectionTypes()) {
          const sigs = member.getCallSignatures();
          if (sigs.length > 0) {
            callSigs = sigs;
            break;
          }
        }
      }

      if (callSigs.length > 0) {
        const propsParam = callSigs[0].getParameters()[0];
        if (propsParam) {
          extractComponentProps(
            propsParam.getTypeAtLocation(decl),
            symbol,
            sourceFile,
          );
        }
      }
    }

    symbols.push(symbol);
  }

  // Sort: components first, then hooks, then types, then functions, then constants
  const kindOrder: Record<string, number> = {
    component: 0,
    hook: 1,
    interface: 2,
    function: 3,
    const: 4,
    context: 5,
  };
  symbols.sort((a, b) => {
    const ka = kindOrder[a.kind] ?? 99;
    const kb = kindOrder[b.kind] ?? 99;
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name);
  });

  return symbols;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const extractedSymbols = extract();

// Deduplicate type strings into a flat list, rewriting inline types as ids.
const typeIndex = new Map<string, number>();
function intern(t: string): number {
  let id = typeIndex.get(t);
  if (id === undefined) {
    id = typeIndex.size;
    typeIndex.set(t, id);
  }
  return id;
}

const normalizedSymbols = extractedSymbols.map((sym) => {
  const next: Record<string, unknown> = { ...sym };
  if (sym.properties)
    next.properties = sym.properties.map((p) => ({
      ...p,
      type: intern(p.type),
    }));
  if (sym.parameters)
    next.parameters = sym.parameters.map((p) => ({
      ...p,
      type: intern(p.type),
    }));
  if (sym.returnType !== undefined) next.returnType = intern(sym.returnType);
  if (sym.stateType !== undefined) next.stateType = intern(sym.stateType);
  return next;
});

const types: string[] = Array.from({ length: typeIndex.size });
for (const [str, id] of typeIndex) types[id] = str;

const output = { types, symbols: normalizedSymbols };
const outputPath = path.resolve(__dirname, "../api-data/symbols.gen.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(
  `Wrote ${normalizedSymbols.length} symbols (${types.length} unique types) to ${outputPath}`,
);

// ts-morph keeps the TypeScript program/host alive, so this process can fail to
// exit once its work is done — the event loop never drains. On a local TTY it
// happens to exit, but piped into a CI log (e.g. Netlify) it hangs on exit,
// stalling the `&& vite build` step. The output file is already written
// synchronously above, so force a clean exit.
process.exit(0);
