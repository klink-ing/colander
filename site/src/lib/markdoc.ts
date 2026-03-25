import Markdoc, { type Config, type Schema } from '@markdoc/markdoc'

export interface DocFrontmatter {
  title: string
  description: string
  order: number
  section: string
}

const apiTag: Schema = {
  render: 'ApiReference',
  selfClosing: true,
  attributes: {
    symbol: { type: String, required: true },
  },
}

const calloutTag: Schema = {
  render: 'Callout',
  children: ['paragraph', 'tag', 'list'],
  attributes: {
    type: {
      type: String,
      default: 'info',
      matches: ['info', 'warning', 'error'],
    },
  },
}

const fenceNode: Schema = {
  render: 'CodeBlock',
  attributes: {
    content: { type: String },
    language: { type: String },
  },
}

const config: Config = {
  tags: {
    api: apiTag,
    callout: calloutTag,
  },
  nodes: {
    fence: fenceNode,
  },
}

export function parseFrontmatter(raw: string): {
  frontmatter: DocFrontmatter
  content: string
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return {
      frontmatter: { title: '', description: '', order: 0, section: '' },
      content: raw,
    }
  }

  const yamlBlock = match[1]
  const content = match[2]

  const frontmatter: Record<string, string | number> = {}
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: string | number = line.slice(colonIdx + 1).trim()
    if (/^\d+$/.test(value)) {
      value = Number.parseInt(value, 10)
    }
    frontmatter[key] = value
  }

  return {
    frontmatter: frontmatter as unknown as DocFrontmatter,
    content,
  }
}

export function parseMarkdoc(source: string) {
  const ast = Markdoc.parse(source)
  const transformed = Markdoc.transform(ast, config)
  return transformed
}
