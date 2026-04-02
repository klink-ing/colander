import * as fs from "node:fs";
import * as path from "node:path";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import MarkdocRenderer from "#/components/MarkdocRenderer";
import {
  type DocFrontmatter,
  parseFrontmatter,
  parseMarkdoc,
} from "#/lib/markdoc";
import { resolveExamples } from "#/lib/resolve-examples";

const getDocContent = createServerFn()
  .inputValidator((slug: unknown) => slug as string)
  .handler(async ({ data: slug }) => {
    const filePath = path.resolve(process.cwd(), "content/docs", `${slug}.md`);

    try {
      if (!fs.existsSync(filePath)) {
        throw notFound();
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const transformed = parseMarkdoc(content);
      // Inject formatted, highlighted example code into ExampleBlock nodes
      await resolveExamples(transformed);

      return {
        frontmatter,
        // Markdoc's RenderableTreeNode contains non-serializable properties;
        // round-tripping through JSON strips them so the data can cross the
        // server/client boundary.
        content: JSON.parse(JSON.stringify(transformed)),
      };
    } catch (error) {
      // Re-throw notFound errors so TanStack Router handles them
      if (error && typeof error === "object" && "isNotFound" in error) {
        throw error;
      }
      console.error(`Failed to load doc "${slug}":`, error);
      throw notFound();
    }
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
        title: `${loaderData?.frontmatter.title} - ${import.meta.env.VITE_PROJECT_NAME}`,
      },
      ...(loaderData?.frontmatter.description
        ? [{ name: "description", content: loaderData.frontmatter.description }]
        : []),
    ],
  }),
  component: DocPage,
});

function DocPage() {
  const { frontmatter, content } = Route.useLoaderData() as {
    frontmatter: DocFrontmatter;
    content: Parameters<typeof MarkdocRenderer>[0]["content"];
  };

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
