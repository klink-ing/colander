import Markdoc, { type Config, type Schema } from "@markdoc/markdoc";
import { PACKAGE_NAME, PROJECT_NAME } from "../config";

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
  },
};

const installCmdTag: Schema = {
  render: "InstallCmd",
  selfClosing: true,
  attributes: {},
};

const headingNode: Schema = {
  render: "Heading",
  children: ["inline"],
  attributes: {
    level: { type: Number, required: true },
    class: { type: String },
  },
  transform(node, config) {
    const level = node.attributes.level as number;
    const children = node.transformChildren(config);
    const text = children.map((c) => (typeof c === "string" ? c : "")).join("");
    const id =
      (node.attributes.id as string | undefined) ??
      text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    return new Markdoc.Tag("Heading", { level, id }, children);
  },
};

const paragraphNode: Schema = {
  render: "Paragraph",
  children: ["inline"],
  attributes: {
    class: { type: String },
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
