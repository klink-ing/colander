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
import { Project, type Type, SyntaxKind, type Node } from "ts-morph";

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
    // Functions
    if (kind === SyntaxKind.FunctionDeclaration) {
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
  const indexPath = path.join(rootDir, "src/index.ts");

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
        let props: ExtractedProperty[] = [];

        if (type.isIntersection()) {
          // For intersection types (e.g. ComponentProps<"table", State> & GridOwnProps),
          // only extract from members whose declarations are in our own source files.
          // This gives us the OwnProps without flooding with 200+ React HTML attributes.
          const seen = new Set<string>();
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
        } else if (type.isUnion()) {
          // For discriminated unions (e.g. CalendarProviderProps = Base & (A | B | C)),
          // TS flattens into a union of intersections. type.getProperties() returns
          // the properties common to all union members.
          props = extractPropertiesFromType(type);
        } else {
          props = extractPropertiesFromType(type);
        }

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
      symbol.parameters = func.getParameters().map((p) => ({
        name: p.getName(),
        type: resolveTypeText(p.getType()),
        description: "", // Could parse @param tags
        optional: p.isOptional(),
      }));
      const returnType = func.getReturnType();
      symbol.returnType = resolveTypeText(returnType);
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

const symbols = extract();
const outputPath = path.resolve(__dirname, "../api-data/symbols.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2));
console.log(`Wrote ${symbols.length} symbols to ${outputPath}`);
