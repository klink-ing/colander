import Markdoc, { type Config, type Schema } from "@markdoc/markdoc";
import { PACKAGE_NAME, PROJECT_NAME } from "#/config";
import { cn } from "./utils";

export interface DocFrontmatter {
  title: string;
  description: string;
  order: number;
  section: string;
}

/** Global variables available in Markdoc content as {% $varName %}. */
export const markdocVariables: Record<string, string> = {
  projectName: PROJECT_NAME,
  packageName: PACKAGE_NAME,
};

const apiTag: Schema = {
  render: "ApiReference",
  selfClosing: true,
  attributes: {
    symbol: { type: String, required: true },
  },
};

const calloutTag: Schema = {
  render: "Callout",
  children: ["paragraph", "tag", "list"],
  attributes: {
    type: {
      type: String,
      default: "info",
      matches: ["info", "warning", "error"],
    },
  },
};

const exampleTag: Schema = {
  render: "ExampleBlock",
  selfClosing: true,
  attributes: {
    file: { type: String, required: true },
    // These are injected server-side by resolveExamples()
    tsHtml: { type: String },
    jsHtml: { type: String },
    language: { type: String },
  },
};

const installCmdTag: Schema = {
  render: "InstallCmd",
  selfClosing: true,
  attributes: {},
};

const headingTypeClass: Record<number, string> = {
  1: "type-display-300",
  2: "type-heading-200",
  3: "type-heading-100",
  4: "type-label-200",
  5: "type-label-100",
  6: "type-heading-100",
};

const headingNode: Schema = {
  children: ["inline"],
  attributes: {
    level: { type: Number, required: true },
  },
  transform(node, config) {
    const level = node.attributes.level as number;
    const children = node.transformChildren(config);
    const annotation = node.attributes.class as string | undefined;
    const text = children.map((c) => (typeof c === "string" ? c : "")).join("");
    const id =
      (node.attributes.id as string | undefined) ??
      text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    return new Markdoc.Tag(
      `h${level}`,
      {
        id,
        className: cn(
          headingTypeClass[level] ?? "type-heading-100",
          "mt-8 mb-4 text-foreground",
          annotation,
        ),
      },
      children,
    );
  },
};

const paragraphNode: Schema = {
  children: ["inline"],
  transform(node, config) {
    const children = node.transformChildren(config);
    const annotation = node.attributes.class as string | undefined;
    return new Markdoc.Tag(
      "p",
      { className: cn("mb-4 type-body-200 text-muted-foreground", annotation) },
      children,
    );
  },
};

const fenceNode: Schema = {
  render: "CodeBlock",
  attributes: {
    content: { type: String },
    language: { type: String },
  },
};

const config: Config = {
  tags: {
    api: apiTag,
    callout: calloutTag,
    example: exampleTag,
    "install-cmd": installCmdTag,
  },
  nodes: {
    heading: headingNode,
    paragraph: paragraphNode,
    fence: fenceNode,
  },
  variables: markdocVariables,
};

/**
 * Interpolate `$varName` references in a string using markdocVariables.
 * Used for frontmatter values so they can reference global variables.
 */
function interpolate(value: string): string {
  return value.replace(/\$(\w+)/g, (match, name) => {
    return name in markdocVariables ? markdocVariables[name] : match;
  });
}

export function parseFrontmatter(raw: string): {
  frontmatter: DocFrontmatter;
  content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { title: "", description: "", order: 0, section: "" },
      content: raw,
    };
  }

  const yamlBlock = match[1];
  const content = match[2];

  const frontmatter: Record<string, string | number> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: string | number = line.slice(colonIdx + 1).trim();
    if (/^\d+$/.test(value)) {
      value = Number.parseInt(value, 10);
    } else {
      value = interpolate(value);
    }
    frontmatter[key] = value;
  }

  return {
    frontmatter: frontmatter as unknown as DocFrontmatter,
    content,
  };
}

export function parseMarkdoc(source: string) {
  const ast = Markdoc.parse(source);
  const transformed = Markdoc.transform(ast, config);
  return transformed;
}
