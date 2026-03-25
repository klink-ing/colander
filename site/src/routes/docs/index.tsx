import { Link, createFileRoute } from '@tanstack/react-router'
import { Route as docsRoute } from '#/routes/docs'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  const { entries } = docsRoute.useLoaderData()

  return (
    <div>
      <h1 className="type-display-100 mb-4 text-foreground">
        Documentation
      </h1>
      <p className="type-body-200 mb-8 text-muted-foreground">
        Learn how to use {import.meta.env.VITE_PROJECT_NAME}{' '}to build accessible, customizable calendar components.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            to="/docs/$slug"
            params={{ slug: entry.slug }}
            className="block rounded-2xl border border-border bg-card p-5 no-underline shadow-md transition hover:-translate-y-0.5"
          >
            <h2 className="type-body-200-bold mb-1 text-foreground">
              {entry.frontmatter.title}
            </h2>
            <p className="type-body-100 m-0 text-muted-foreground">
              {entry.frontmatter.description || ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
