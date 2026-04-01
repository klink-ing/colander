import { createContext, useContext, type ReactNode } from "react";
import type { DocsNavEntry, ApiDocsNavEntry } from "#/components/DocsNav";

interface DocsNavData {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}

const DocsNavDataContext = createContext<DocsNavData | null>(null);

export function DocsNavDataProvider({
  entries,
  apiEntries,
  children,
}: DocsNavData & { children: ReactNode }) {
  return (
    <DocsNavDataContext.Provider value={{ entries, apiEntries }}>
      {children}
    </DocsNavDataContext.Provider>
  );
}

export function useDocsNavData() {
  return useContext(DocsNavDataContext);
}
