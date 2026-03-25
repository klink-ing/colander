import { Link, createFileRoute } from '@tanstack/react-router'
import { Route as docsRoute } from '#/routes/docs'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  const { entries } = docsRoute.useLoaderData()

  return (
    <div>
      <h1 className="type-display-100 mb-4 text-fg">
        Documentation
      </h1>
      <p className="type-body-200 mb-8 text-fg-muted">
        Learn how to use {import.meta.env.VITE_PROJECT_NAME}{' '}to build accessible, customizable calendar components.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            to="/docs/$slug"
            params={{ slug: entry.slug }}
            className="island-shell feature-card block rounded-2xl p-5 no-underline"
          >
            <h2 className="type-body-200-bold mb-1 text-fg">
              {entry.frontmatter.title}
            </h2>
            <p className="type-body-100 m-0 text-fg-muted">
              {entry.frontmatter.description || ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
