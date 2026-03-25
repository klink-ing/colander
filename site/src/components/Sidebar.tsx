import { Link, useLocation } from '@tanstack/react-router'
import type { DocFrontmatter } from '#/lib/markdoc'

export interface SidebarEntry {
  slug: string
  frontmatter: DocFrontmatter
}

export default function Sidebar({ entries }: { entries: SidebarEntry[] }) {
  const location = useLocation()

  const grouped = new Map<string, SidebarEntry[]>()
  for (const entry of entries) {
    const section = entry.frontmatter.section || 'General'
    if (!grouped.has(section)) {
      grouped.set(section, [])
    }
    grouped.get(section)!.push(entry)
  }

  // Sort entries within each group by order
  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order)
  }

  return (
    <nav className="w-56 shrink-0 pr-6">
      <div className="sticky top-20">
        {Array.from(grouped.entries()).map(([section, entries]) => (
          <div key={section} className="mb-5">
            <h4 className="island-kicker mb-2 text-[10px]">{section}</h4>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {entries.map((entry) => {
                const path = `/docs/${entry.slug}`
                const isActive = location.pathname === path
                return (
                  <li key={entry.slug}>
                    <Link
                      to={path}
                      className={`block rounded-lg px-3 py-1.5 text-sm no-underline transition ${
                        isActive
                          ? 'bg-[rgba(79,184,178,0.14)] font-semibold text-[var(--lagoon-deep)]'
                          : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
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
      </div>
    </nav>
  )
}
