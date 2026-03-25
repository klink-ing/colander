import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="type-label-100 mb-3 text-kicker">Accessible calendar components for React</p>
        <h1 className="type-display-200 mb-5 max-w-3xl text-foreground">
          {import.meta.env.VITE_PROJECT_NAME}
        </h1>
        <p className="type-body-200 mb-8 max-w-2xl text-muted-foreground">
          Accessible, customizable calendar components for React. Built on Base UI
          and the Temporal API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/docs/$slug"
            params={{ slug: 'getting-started' }}
            className="type-body-100-bold rounded-full border border-primary bg-accent px-5 py-2.5 text-accent-foreground no-underline transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            Get Started
          </Link>
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="type-body-100-bold rounded-full border border-border bg-secondary px-5 py-2.5 text-foreground no-underline transition hover:-translate-y-0.5"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['MonthView', 'Traditional month grid calendar view with full keyboard navigation.'],
          ['WeeksView', 'Continuous scrolling weeks view for compact layouts.'],
          ['Range Selection', 'Built-in support for selecting date ranges with drag.'],
          ['Keyboard Navigation', 'Full arrow-key, Home/End, and Page Up/Down support.'],
          ['Temporal API', 'Uses the Temporal API for correct date handling across time zones.'],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="type-body-200-bold mb-2 text-foreground">
              {title}
            </h2>
            <p className="type-body-100 m-0 text-muted-foreground">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
