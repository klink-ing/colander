import DocsNav, { type DocsNavEntry, type ApiDocsNavEntry } from "./DocsNav";

export default function DocsNavSidebar({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  return (
    <div className="w-56 bp-7.5:block hidden shrink-0 pr-6">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <DocsNav entries={entries} apiEntries={apiEntries} />
      </div>
    </div>
  );
}
