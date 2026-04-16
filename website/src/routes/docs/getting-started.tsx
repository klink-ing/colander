// Auto-generated from getting-started.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc-tags";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Getting Started",
  description:
    "Install Colander and start building accessible calendar components.",
  order: 1,
  section: "Guides",
};

export const Route = createFileRoute("/docs/getting-started")({
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
        <Tags.Heading level={2} id="installation">
          Installation
        </Tags.Heading>
        <Tags.InstallCmd />
        <Tags.Heading level={2} id="basic-usage">
          Basic Usage
        </Tags.Heading>
        <Tags.Paragraph>
          Colander provides two calendar views that share state via{" "}
          <code>CalendarProvider</code>:
        </Tags.Paragraph>
        <ul>
          <li>
            <strong>MonthView</strong> — Traditional month grid
          </li>
          <li>
            <strong>WeeksView</strong> — Continuous scrolling weeks
          </li>
        </ul>
        <Tags.Heading level={2} id="quick-example">
          Quick Example
        </Tags.Heading>
        <Tags.ExampleBlock file="basic-calendar.tsx" />
      </article>
    </div>
  );
}
