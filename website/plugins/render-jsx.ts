interface TagNode {
  $$mdtype: "Tag";
  name: string;
  attributes: Record<string, unknown>;
  children: AstNode[];
}

export type AstNode = string | TagNode | null | AstNode[];

function escapeJsxText(text: string): string {
  if (!/[{}<>]/.test(text)) return text;
  return `{${JSON.stringify(text)}}`;
}

function renderAttrValue(value: unknown): string {
  if (typeof value === "string") {
    if (/["{}<>]/.test(value)) return `{${JSON.stringify(value)}}`;
    return `"${value}"`;
  }
  if (typeof value === "number") return `{${value}}`;
  if (typeof value === "boolean") return value ? "" : `{false}`;
  return `{${JSON.stringify(value)}}`;
}

function renderAttrs(
  attrs: Record<string, unknown>,
  isHtmlElement: boolean,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;

    const propName = key === "class" && isHtmlElement ? "className" : key;

    const rendered = renderAttrValue(value);
    if (typeof value === "boolean" && value) {
      parts.push(propName);
    } else {
      parts.push(`${propName}=${rendered}`);
    }
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

/** Recursively convert a Markdoc AST node to JSX source code. */
export function renderToJsx(node: AstNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return escapeJsxText(node);
  if (Array.isArray(node)) return node.map(renderToJsx).join("");

  const { name, attributes, children } = node;
  const isHtml = name[0] === name[0].toLowerCase();
  const tag = isHtml ? name : `Tags.${name}`;
  const attrStr = renderAttrs(attributes, isHtml);
  const childStr = children.map(renderToJsx).join("");

  if (!childStr) return `<${tag}${attrStr} />`;
  return `<${tag}${attrStr}>${childStr}</${tag}>`;
}
