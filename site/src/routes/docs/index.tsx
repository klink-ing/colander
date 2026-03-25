import { Link, createFileRoute } from '@tanstack/react-router'
import { Route as docsRoute } from '#/routes/docs'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  const entries = docsRoute.useLoaderData()

  return (
    <div>
      <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)]">
        Documentation
      </h1>
      <p className="mb-8 text-[var(--sea-ink-soft)]">
        Learn how to use base-ui-cal to build accessible, customizable calendar components.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            to="/docs/$slug"
            params={{ slug: entry.slug }}
            className="island-shell feature-card block rounded-2xl p-5 no-underline"
          >
            <h2 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">
              {entry.frontmatter.title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              {entry.frontmatter.description || ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
