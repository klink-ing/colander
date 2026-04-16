// Auto-generated from calendar-provider.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "CalendarProvider",
  description:
    "Manages shared state across calendar views — selection, bounds, locale, and more.",
  order: 2,
  section: "Components",
};

export const Route = createFileRoute("/docs/calendar-provider")({
  loader: () => ({ frontmatter }),
  head: () => ({
    meta: [
      { title: `${frontmatter.title} - ${PROJECT_NAME}` },
      ...(frontmatter.description
        ? [{ name: "description", content: frontmatter.description }]
        : []),
    ],
  }),
  component: DocContent,
});

function DocContent() {
  return (
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
  );
}
