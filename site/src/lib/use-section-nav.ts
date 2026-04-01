import { useMatches } from "@tanstack/react-router";
import type { DocsNavEntry, ApiDocsNavEntry } from "#/components/DocsNav";

export interface SectionNav {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}

export function useSectionNav(): SectionNav | null {
  return useMatches({
    select: (matches) => {
      for (const match of matches) {
        const data = match.loaderData as Record<string, unknown> | undefined;
        if (data && "sectionNav" in data && data.sectionNav != null) {
          return data.sectionNav as SectionNav;
        }
      }
      return null;
    },
  });
}
