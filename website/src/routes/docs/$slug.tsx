import type { RenderableTreeNodes } from "@markdoc/markdoc";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import MarkdocRenderer from "#/components/MarkdocRenderer";
import { PROJECT_NAME } from "#/config";
import type { DocFrontmatter } from "#/lib/markdoc";

interface DocData {
  frontmatter: DocFrontmatter;
  content: RenderableTreeNodes;
}

const docsData = import.meta.glob<DocData>("../../docs-data/*.doc.gen.json", {
  eager: true,
});

function getDocBySlug(slug: string): DocData | undefined {
  const key = `../../docs-data/${slug}.doc.gen.json`;
  return docsData[key];
}

const getDocContent = createServerFn()
  .inputValidator((slug: unknown) => slug as string)
  .handler(async ({ data: slug }) => {
    const doc = getDocBySlug(slug);
    if (!doc) throw notFound();
    return doc;
  });

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => getDocContent({ data: params.slug }),
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
  const { frontmatter, content } = Route.useLoaderData();

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
      <MarkdocRenderer content={content} />
    </div>
  );
}
