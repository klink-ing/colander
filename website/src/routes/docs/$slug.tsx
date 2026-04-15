import { createFileRoute, notFound } from "@tanstack/react-router";
import { PROJECT_NAME } from "#/config";
import { docs } from "../../docs-data/index.gen";

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => {
    const entry = docs[params.slug];
    if (!entry) throw notFound();
    return { slug: params.slug, frontmatter: entry.frontmatter };
  },
  notFoundComponent: () => (
    <div className="py-12 text-center">
      <h1 className="mb-2 type-heading-300 text-foreground">Page not found</h1>
      <p className="type-body-200 text-muted-foreground">
        The documentation page you requested does not exist.
      </p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.frontmatter.title} - ${PROJECT_NAME}`,
      },
      ...(loaderData?.frontmatter.description
        ? [{ name: "description", content: loaderData.frontmatter.description }]
        : []),
    ],
  }),
  component: DocPage,
});

function DocPage() {
  const { slug, frontmatter } = Route.useLoaderData();
  const { Component: DocContent } = docs[slug];

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
      <DocContent />
    </div>
  );
}
