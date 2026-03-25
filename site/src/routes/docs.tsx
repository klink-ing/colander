import { Outlet, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as fs from 'node:fs'
import * as path from 'node:path'
import Sidebar, { type SidebarEntry } from '#/components/Sidebar'
import { parseFrontmatter } from '#/lib/markdoc'

const getDocEntries = createServerFn().handler(async () => {
  try {
    const contentDir = path.resolve(process.cwd(), 'content/docs')
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'))

    const entries: SidebarEntry[] = files.map((file) => {
      const slug = file.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8')
      const { frontmatter } = parseFrontmatter(raw)
      return { slug, frontmatter }
    })

    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order)
    return entries
  } catch (error) {
    console.error('Failed to load doc entries:', error)
    return []
  }
})

export const Route = createFileRoute('/docs')({
  loader: () => getDocEntries(),
  component: DocsLayout,
})

function DocsLayout() {
  const entries = Route.useLoaderData()

  return (
    <main className="page-wrap flex gap-0 px-4 pb-12 pt-8">
      <Sidebar entries={entries} />
      <article className="prose prose-neutral dark:prose-invert min-w-0 max-w-none flex-1">
        <Outlet />
      </article>
    </main>
  )
}
