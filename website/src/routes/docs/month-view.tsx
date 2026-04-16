// Auto-generated from month-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc-tags";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "MonthView",
  description:
    "Displays a traditional calendar grid with month-level navigation.",
  order: 3,
  section: "Components",
};

export const Route = createFileRoute("/docs/month-view")({
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
      <Tags.ApiReference symbol="MonthViewRootProps" />
      <Tags.Heading level={2} id="hooks">
        Hooks
      </Tags.Heading>
      <Tags.ApiReference symbol="MonthViewStableContextValue" />
      <Tags.ApiReference symbol="MonthViewStateContextValue" />
    </article>
  );
}
