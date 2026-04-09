import { Link, createFileRoute } from "@tanstack/react-router";
import { Card } from "#/components/ui/card";
import { Route as docsRoute } from "#/routes/docs";

export const Route = createFileRoute("/docs/")({
  component: DocsIndex,
});

function DocsIndex() {
  const { sectionNav } = docsRoute.useLoaderData();
  const { entries } = sectionNav;

  return (
    <div>
      <h1 className="mb-4 type-display-200 text-foreground">Documentation</h1>
      <p className="mb-8 type-body-200 text-muted-foreground">
        Learn how to use {import.meta.env.VITE_PROJECT_NAME} to build
        accessible, customizable calendar components.
      </p>
      <div className="bp-6:grid-cols-2 grid gap-4">
        {entries.map((entry) => (
          <Card
            key={entry.slug}
            render={
              <Link
                key={entry.slug}
                to="/docs/$slug"
                params={{ slug: entry.slug }}
                className="block p-5 no-underline hover:-translate-y-0.5"
              />
            }
          >
            <h2 className="mb-1 type-body-200-bold text-foreground">
              {entry.frontmatter.title}
            </h2>
            <p className="m-0 type-body-100 text-muted-foreground">
              {entry.frontmatter.description || ""}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
