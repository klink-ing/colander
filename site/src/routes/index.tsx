import { Link, createFileRoute } from "@tanstack/react-router";
import { cn } from "#/lib/cn";
import { ButtonA } from "#/components/ui/button";
import { Image } from "@unpic/react";
import heroImage from "#/content/images/hero.png";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in relative overflow-hidden  py-10  bp-6:py-14 items-center text-center flex flex-col">
        <h1
          className={cn(
            "mb-5 text-foreground  type-display-100 ",
          )}
        >
          {import.meta.env.VITE_PROJECT_NAME}
        </h1>
        <Image {...heroImage} alt="Hero" className="w-full h-auto" layout="fullWidth" />
        <p className="mb-8 type-body-300 text-muted-foreground  max-w-[60ch] text-balance">
          Accessible, customizable calendar components for React. Built on Base
          UI and the Temporal API.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonA
            variant="default"
            size="xl"
            className="squircle-xl squircle-amt-1"
            render={<Link to="/docs/$slug" params={{ slug: "getting-started" }} />}
          >
            Get Started
          </ButtonA>
          <ButtonA
            variant="secondary"
            className="squircle-xl squircle-amt-1.5"
            size="xl"
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </ButtonA>
          <ButtonA
            variant="default"
            className="squircle-xl squircle-amt-2"
            size="xl"
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </ButtonA>
        </div>
      </section>

      <section className="mt-8 grid gap-4 bp-6:grid-cols-2 bp-10:grid-cols-5">
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
