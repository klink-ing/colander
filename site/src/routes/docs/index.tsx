import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <div>
      <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)]">
        Documentation
      </h1>
      <p className="mb-8 text-[var(--sea-ink-soft)]">
        Learn how to use base-ui-cal to build accessible, customizable calendar components.
      </p>
      <DocsGrid />
    </div>
  )
}

function DocsGrid() {
  const sections = [
    {
      title: 'Getting Started',
      description: 'Install and set up base-ui-cal in your project.',
      slug: 'getting-started',
    },
    {
      title: 'CalendarProvider',
      description: 'Shared state provider for all calendar views.',
      slug: 'calendar-provider',
    },
    {
      title: 'MonthView',
      description: 'Traditional month grid calendar view.',
      slug: 'month-view',
    },
    {
      title: 'WeeksView',
      description: 'Continuous scrolling weeks view.',
      slug: 'weeks-view',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((s) => (
        <Link
          key={s.slug}
          to="/docs/$slug"
          params={{ slug: s.slug }}
          className="island-shell feature-card block rounded-2xl p-5 no-underline"
        >
          <h2 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">{s.title}</h2>
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{s.description}</p>
        </Link>
      ))}
    </div>
  )
}
