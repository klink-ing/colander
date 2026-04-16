// Auto-generated from weeks-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc-tags";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "WeeksView",
  description:
    "Displays a configurable window of continuous week rows that span month boundaries.",
  order: 4,
  section: "Components",
};

export const Route = createFileRoute("/docs/weeks-view")({
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
        <Tags.ApiReference symbol="WeeksViewRootProps" />
        <Tags.Heading level={2} id="window-info">
          Window Info
        </Tags.Heading>
        <Tags.ApiReference symbol="WindowInfo" />
        <Tags.Heading level={2} id="first-week-spec">
          First Week Spec
        </Tags.Heading>
        <Tags.ApiReference symbol="FirstWeekSpec" />
      </article>
    </div>
  );
}
