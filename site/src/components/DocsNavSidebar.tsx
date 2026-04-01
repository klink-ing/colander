import DocsNav, { type DocsNavEntry, type ApiDocsNavEntry } from "./DocsNav";

export default function DocsNavSidebar({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  return (
    <div className="hidden w-56 shrink-0 pr-6 bp-6:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <DocsNav entries={entries} apiEntries={apiEntries} />
      </div>
    </div>
  );
}
