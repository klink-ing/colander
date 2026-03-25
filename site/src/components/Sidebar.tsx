import { Link, useLocation } from '@tanstack/react-router'
import type { DocFrontmatter } from '#/lib/markdoc'

export interface SidebarEntry {
  slug: string
  frontmatter: DocFrontmatter
}

export interface ApiSidebarEntry {
  name: string
  kind: string
}

const kindOrder: Record<string, number> = {
  component: 0,
  hook: 1,
  interface: 2,
  function: 3,
  context: 4,
  const: 5,
}

const kindLabels: Record<string, string> = {
  component: 'Components',
  hook: 'Hooks',
  interface: 'Types',
  function: 'Functions',
  context: 'Contexts',
  const: 'Constants',
}

export default function Sidebar({
  entries,
  apiEntries,
}: {
  entries: SidebarEntry[]
  apiEntries: ApiSidebarEntry[]
}) {
  const location = useLocation()

  const grouped = new Map<string, SidebarEntry[]>()
  for (const entry of entries) {
    const section = entry.frontmatter.section || 'General'
    if (!grouped.has(section)) {
      grouped.set(section, [])
    }
    grouped.get(section)!.push(entry)
  }

  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order)
  }

  // Group API entries by kind
  const apiGrouped = new Map<string, ApiSidebarEntry[]>()
  for (const entry of apiEntries) {
    const kind = entry.kind
    if (!apiGrouped.has(kind)) {
      apiGrouped.set(kind, [])
    }
    apiGrouped.get(kind)!.push(entry)
  }

  const sortedApiKinds = [...apiGrouped.keys()].sort(
    (a, b) => (kindOrder[a] ?? 99) - (kindOrder[b] ?? 99),
  )

  return (
    <nav className="w-56 shrink-0 pr-6" aria-label="Documentation navigation">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {Array.from(grouped.entries()).map(([section, entries]) => (
          <div key={section} className="mb-5">
            <h4 className="type-label-100 mb-2 text-muted-foreground">{section}</h4>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {entries.map((entry) => {
                const path = `/docs/${entry.slug}`
                const isActive = location.pathname === path
                return (
                  <li key={entry.slug}>
                    <Link
                      to={path}
                      aria-current={isActive ? 'page' : undefined}
                      className={`type-body-100 block rounded-lg px-3 py-1.5 no-underline transition ${
                        isActive
                          ? 'bg-accent font-semibold text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {entry.frontmatter.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {sortedApiKinds.map((kind) => {
          const items = apiGrouped.get(kind)!
          return (
            <div key={kind} className="mb-5">
              <h4 className="type-label-100 mb-2 text-muted-foreground">
                {kindLabels[kind] ?? kind}
              </h4>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {items.map((item) => {
                  const path = `/docs/api/${item.name}`
                  const isActive = location.pathname === path
                  return (
                    <li key={item.name}>
                      <Link
                        to="/docs/api/$symbol"
                        params={{ symbol: item.name }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`type-code-100 block rounded-lg px-3 py-1.5 no-underline transition ${
                          isActive
                            ? 'bg-accent font-semibold text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
