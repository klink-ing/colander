import { Link, createFileRoute } from "@tanstack/react-router";
import { cn } from "#/lib/cn";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-10 shadow-lg sm:px-10 sm:py-14">
        <p className="mb-3 type-label-100 text-muted-foreground">
          Accessible calendar components for React
        </p>
        <h1
          className={cn(
            "mb-5 max-w-3xl font-extrabold text-foreground italic type-display-100 ",
          )}
        >
          {import.meta.env.VITE_PROJECT_NAME}
        </h1>
        <p className="mb-8 max-w-2xl type-body-200 text-muted-foreground">
          Accessible, customizable calendar components for React. Built on Base
          UI and the Temporal API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/docs/$slug"
            params={{ slug: "getting-started" }}
            className="rounded-full border border-primary bg-accent px-5 py-2.5 type-body-100-bold text-accent-foreground no-underline transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            Get Started
          </Link>
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border bg-secondary px-5 py-2.5 type-body-100-bold text-foreground no-underline transition hover:-translate-y-0.5"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            "MonthView",
            "Traditional month grid calendar view with full keyboard navigation.",
          ],
          ["WeeksView", "Continuous scrolling weeks view for compact layouts."],
          [
            "Range Selection",
            "Built-in support for selecting date ranges with drag.",
          ],
          [
            "Keyboard Navigation",
            "Full arrow-key, Home/End, and Page Up/Down support.",
          ],
          [
            "Temporal API",
            "Uses the Temporal API for correct date handling across time zones.",
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="rise-in rounded-2xl border border-border bg-card p-5 shadow-md transition hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 type-body-200-bold text-foreground">{title}</h2>
            <p className="m-0 type-body-100 text-muted-foreground">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
