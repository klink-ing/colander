import { Link, createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import heroImage from "#/assets/images/colander.png";
import { GithubIcon } from "#/components/icons/GithubIcon";
import { LinkInline } from "#/components/LinkInline";
import { ButtonA } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { GITHUB_REPO_URL, PROJECT_NAME } from "#/config";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="relative flex flex-col items-center text-center">
        <h1
          className={cn(
            "mb-10 pt-4 pb-4 type-display-300 text-foreground text-trim-cap bp-6:pt-8",
          )}
        >
          {PROJECT_NAME}
        </h1>
        <Image
          src={heroImage.src}
          width={heroImage.width}
          height={heroImage.height}
          alt="Hero"
          className="h-auto w-full max-w-[max(80vh,50vw,100px)]"
        />
        <p className="mb-8 max-w-[60ch] pt-6 type-body-300-semi text-balance text-muted-foreground">
          Accessible, customizable calendar components for React. Built on{" "}
          <LinkInline href="https://base-ui.com">Base UI</LinkInline> and the{" "}
          <LinkInline href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal">
            Temporal API
          </LinkInline>
          .
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonA variant="default" size="xl" render={<Link to="/demo" />}>
            See Demo
          </ButtonA>
          <ButtonA
            variant="secondary"
            size="xl"
            render={<Link to="/docs/quick-start" />}
          >
            Get Started
          </ButtonA>
          <ButtonA
            variant="secondary"
            size="xl"
            href={GITHUB_REPO_URL}
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
          <Card
            key={title}
            render={<article />}
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 type-body-200-bold text-foreground">{title}</h2>
            <p className="m-0 type-body-100 text-muted-foreground">{desc}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
