// Auto-generated from weeks-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "WeeksView",
  description:
    "Displays a configurable window of continuous week rows that span month boundaries.",
  order: 4,
  section: "Components",
};

export const Route = createFileRoute("/docs/weeks-view")({
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
  );
}
