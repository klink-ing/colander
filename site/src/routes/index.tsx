import { Link, createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import heroImage from "#/assets/colander.png";
import { GithubIcon } from "#/components/icons/GithubIcon";
import { ButtonA } from "#/components/ui/button";
import { cn } from "#/lib/cn";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in relative flex flex-col items-center text-center">
        <h1
          className={cn(
            "mb-10 text-foreground type-display-100 text-trim-both pt-8 pb-4",
          )}
        >
          {import.meta.env.VITE_PROJECT_NAME}
        </h1>
        <Image
          src={heroImage.src}
          width={heroImage.width}
          height={heroImage.height}
          alt="Hero"
          className="h-auto w-full max-w-[max(80vh,100px)]"
        />
        <p className="mb-8 max-w-[60ch] type-body-300-semi text-balance text-muted-foreground">
          Accessible, customizable calendar components for React. Built on Base
          UI and the Temporal API.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonA
            variant="default"
            size="xl"
            render={
              <Link to="/docs/$slug" params={{ slug: "getting-started" }} />
            }
          >
            Get Started
          </ButtonA>
          <ButtonA
            variant="secondary"
            size="xl"
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            iconStart={<GithubIcon className="size-5" />}
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
            className="rise-in  border  border-border bg-card p-5 transition hover:-translate-y-0.5"
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
