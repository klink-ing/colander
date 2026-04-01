import * as fs from "node:fs";
import * as path from "node:path";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import DocsNavSidebar from "#/components/DocsNavSidebar";
import type { DocsNavEntry, ApiDocsNavEntry } from "#/components/DocsNav";
import { getAllSymbols } from "#/lib/api-data";
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

  return (
    <main className="page-wrap flex gap-0 px-4 pt-8 pb-12">
      <DocsNavSidebar entries={entries} apiEntries={apiEntries} />
      <article className="max-w-none min-w-0 flex-1">
        <Outlet />
      </article>
    </main>
  );
}
