import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as fs from 'node:fs'
import * as path from 'node:path'
import MarkdocRenderer from '#/components/MarkdocRenderer'
import { type DocFrontmatter, parseFrontmatter, parseMarkdoc } from '#/lib/markdoc'

const getDocContent = createServerFn()
  .inputValidator((slug: unknown) => slug as string)
  .handler(async ({ data: slug }) => {
    const filePath = path.resolve(process.cwd(), 'content/docs', `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Doc not found: ${slug}`)
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const { frontmatter, content } = parseFrontmatter(raw)
    const transformed = parseMarkdoc(content)

    return {
      frontmatter,
      content: JSON.parse(JSON.stringify(transformed)),
    }
  })

export const Route = createFileRoute('/docs/$slug')({
  loader: ({ params }) => getDocContent({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.frontmatter.title} - base-ui-cal` },
      ...(loaderData?.frontmatter.description
        ? [{ name: 'description', content: loaderData.frontmatter.description }]
        : []),
    ],
  }),
  component: DocPage,
})

function DocPage() {
  const { frontmatter, content } = Route.useLoaderData() as {
    frontmatter: DocFrontmatter
    content: Parameters<typeof MarkdocRenderer>[0]['content']
  }

  return (
    <div>
      <div className="mb-6">
        <p className="island-kicker mb-1">{frontmatter.section}</p>
        <h1 className="display-title mb-2 text-3xl font-bold text-[var(--sea-ink)]">
          {frontmatter.title}
        </h1>
        {frontmatter.description && (
          <p className="text-[var(--sea-ink-soft)]">{frontmatter.description}</p>
        )}
      </div>
      <MarkdocRenderer content={content} />
    </div>
  )
}
