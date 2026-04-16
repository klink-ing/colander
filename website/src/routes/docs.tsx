import { Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { type DocsNavEntry, type ApiDocsNavEntry } from "#/components/DocsNav";
import DocsNavSidebar from "#/components/DocsNavSidebar";
import { getAllSymbols } from "#/lib/api-data";
import type { DocFrontmatter } from "#/lib/markdoc";
import { useNavDrawer } from "#/lib/nav-drawer-context";
import { docEntries } from "../docs-data/nav.gen";

export const Route = createFileRoute("/docs")({
  loader: () => {
    const entries: DocsNavEntry[] = docEntries.map((e) => ({
      slug: e.slug,
      frontmatter: e.frontmatter,
    }));

    const apiEntries: ApiDocsNavEntry[] = getAllSymbols().map((s) => ({
      name: s.name,
      kind: s.kind,
    }));

    return { sectionNav: { entries, apiEntries } };
  },
  component: DocsLayout,
});

function useDocFrontmatter(): DocFrontmatter | undefined {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const loaderData = leaf?.loaderData as
    | { frontmatter?: DocFrontmatter }
    | undefined;
  return loaderData?.frontmatter;
}

function DocsLayout() {
  const { sectionNav } = Route.useLoaderData();
  const { setOpen } = useNavDrawer();
  const frontmatter = useDocFrontmatter();

  return (
    <main className="page-wrap flex gap-0 pt-8 pb-12">
      <DocsNavSidebar
        entries={sectionNav.entries}
        apiEntries={sectionNav.apiEntries}
      />

      <div className="min-w-0 flex-1">
        {/* Sidebar toggle — visible between bp-4.5 and bp-6 only */}
        <button
          type="button"
          data-nav-drawer-trigger
          onClick={() => setOpen(true)}
          className="mb-4 hidden items-center gap-2 squircle-lg border border-border px-3 py-2 type-body-100 text-muted-foreground transition hover:bg-accent hover:text-foreground bp-4.5:flex bp-7.5:hidden"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 4h12M2 8h12M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Navigation
        </button>

        <article className="max-w-none">
          {frontmatter && (
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
          )}
          <Outlet />
        </article>
      </div>
    </main>
  );
}
