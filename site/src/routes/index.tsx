import { AInline, LinkInline } from "#/components/LinkInline";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in border-border bg-card relative overflow-hidden rounded-[2rem] border px-6 py-10 shadow-lg sm:px-10 sm:py-14">
        <p className="type-label-100 text-muted-foreground mb-3">
          Accessible calendar components for React
        </p>{" "}
        <LinkInline to="/docs" className="type-body-200">
          Go somewheres
        </LinkInline>
        NOW
        <h1 className="type-display-200 text-foreground mb-5 max-w-3xl">
          {import.meta.env.VITE_PROJECT_NAME}
        </h1>
        <p className="type-body-200 text-muted-foreground mb-8 max-w-2xl">
          Accessible, customizable calendar components for React. Built on Base
          UI and the Temporal API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/docs/$slug"
            params={{ slug: "getting-started" }}
            className="type-body-100-bold border-primary bg-accent text-accent-foreground hover:bg-primary/10 rounded-full border px-5 py-2.5 no-underline transition hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="type-body-100-bold border-border bg-secondary text-foreground rounded-full border px-5 py-2.5 no-underline transition hover:-translate-y-0.5"
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
            className="rise-in border-border bg-card rounded-2xl border p-5 shadow-md transition hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="type-body-200-bold text-foreground mb-2">{title}</h2>
            <p className="type-body-100 text-muted-foreground m-0">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
