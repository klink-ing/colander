// Auto-generated from calendar-provider.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc-tags";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "CalendarProvider",
  description:
    "Manages shared state across calendar views — selection, bounds, locale, and more.",
  order: 2,
  section: "Components",
};

export const Route = createFileRoute("/docs/calendar-provider")({
  head: () => ({
    meta: [
      { title: `${frontmatter.title} - ${PROJECT_NAME}` },
      ...(frontmatter.description
        ? [{ name: "description", content: frontmatter.description }]
        : []),
    ],
  }),
  component: DocPage,
});

function DocPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 type-label-100 text-muted-foreground">
          {frontmatter.section}
        </p>
        <h1 className="mb-2 type-heading-300 text-foreground">
          {frontmatter.title}
        </h1>
        {frontmatter.description && (
          <p className="type-body-200 text-muted-foreground">
            {frontmatter.description}
          </p>
        )}
      </div>
      <article>
        <Tags.Heading level={2} id="props">
          Props
        </Tags.Heading>
        <Tags.ApiReference symbol="CalendarProviderProps" />
        <Tags.Heading level={2} id="stable-context">
          Stable Context
        </Tags.Heading>
        <Tags.ApiReference symbol="CalendarStableContextValue" />
        <Tags.Heading level={2} id="state-context">
          State Context
        </Tags.Heading>
        <Tags.ApiReference symbol="CalendarStateContextValue" />
      </article>
    </div>
  );
}
