import * as fs from "node:fs";
import * as path from "node:path";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import DocsDrawerContent from "#/components/DocsDrawerContent";
import DocsNav, {
  type DocsNavEntry,
  type ApiDocsNavEntry,
} from "#/components/DocsNav";
import DocsNavSidebar from "#/components/DocsNavSidebar";
import NavDrawer from "#/components/NavDrawer";
import { getAllSymbols } from "#/lib/api-data";
import { useSetHeaderDrawerContent } from "#/lib/header-drawer-context";
import { parseFrontmatter } from "#/lib/markdoc";

const getDocEntries = createServerFn().handler(async () => {
  try {
    const contentDir = path.resolve(process.cwd(), "content/docs");
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

    const entries: DocsNavEntry[] = files.map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
      const { frontmatter } = parseFrontmatter(raw);
      return { slug, frontmatter };
    });

    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order);

    const apiEntries: ApiDocsNavEntry[] = getAllSymbols().map((s) => ({
      name: s.name,
      kind: s.kind,
    }));

    return { entries, apiEntries };
  } catch (error) {
    console.error("Failed to load doc entries:", error);
    return { entries: [], apiEntries: [] };
  }
});

export const Route = createFileRoute("/docs")({
  loader: () => getDocEntries(),
  component: DocsLayout,
});

function DocsLayout() {
  const { entries, apiEntries } = Route.useLoaderData();
  const setHeaderDrawerContent = useSetHeaderDrawerContent();
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);

  // Register combined drawer content for the header (< 450px)
  useEffect(() => {
    setHeaderDrawerContent(
      <DocsDrawerContent entries={entries} apiEntries={apiEntries} />,
    );
    return () => setHeaderDrawerContent(null);
  }, [entries, apiEntries, setHeaderDrawerContent]);

  return (
    <main className="page-wrap flex gap-0 px-4 pt-8 pb-12">
      <DocsNavSidebar entries={entries} apiEntries={apiEntries} />

      <div className="min-w-0 flex-1">
        {/* Sidebar toggle — visible between bp-4.5 and bp-6 only */}
        <button
          type="button"
          onClick={() => setSidebarDrawerOpen(true)}
          className="mb-4 hidden items-center gap-2 rounded-lg border border-border px-3 py-2 type-body-100 text-muted-foreground transition hover:bg-accent hover:text-foreground bp-4.5:flex bp-6:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Navigation
        </button>

        <article className="max-w-none">
          <Outlet />
        </article>
      </div>

      {/* Sidebar drawer for mid-range (450-599px) */}
      <NavDrawer open={sidebarDrawerOpen} onOpenChange={setSidebarDrawerOpen}>
        <DocsNav entries={entries} apiEntries={apiEntries} />
      </NavDrawer>
    </main>
  );
}
