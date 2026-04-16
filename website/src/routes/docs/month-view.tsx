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
        <Tags.ApiReference symbol="MonthViewRootProps" />
        <Tags.Heading level={2} id="hooks">
          Hooks
        </Tags.Heading>
        <Tags.ApiReference symbol="MonthViewStableContextValue" />
        <Tags.ApiReference symbol="MonthViewStateContextValue" />
      </article>
    </div>
  );
}
