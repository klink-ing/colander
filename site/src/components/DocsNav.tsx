import { Link, useLocation } from "@tanstack/react-router";
import type { DocFrontmatter } from "#/lib/markdoc";

export interface DocsNavEntry {
  slug: string;
  frontmatter: DocFrontmatter;
}

export interface ApiDocsNavEntry {
  name: string;
  kind: string;
}

const kindOrder: Record<string, number> = {
  component: 0,
  hook: 1,
  interface: 2,
  function: 3,
  context: 4,
  const: 5,
};

const kindLabels: Record<string, string> = {
  component: "Components",
  hook: "Hooks",
  interface: "Types",
  function: "Functions",
  context: "Contexts",
  const: "Constants",
};

export default function DocsNav({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  const location = useLocation();

  const grouped = new Map<string, DocsNavEntry[]>();
  for (const entry of entries) {
    const section = entry.frontmatter.section || "General";
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(entry);
  }

  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
  }

  const apiGrouped = new Map<string, ApiDocsNavEntry[]>();
  for (const entry of apiEntries) {
    const kind = entry.kind;
    if (!apiGrouped.has(kind)) {
      apiGrouped.set(kind, []);
    }
    apiGrouped.get(kind)!.push(entry);
  }

  const sortedApiKinds = [...apiGrouped.keys()].sort(
    (a, b) => (kindOrder[a] ?? 99) - (kindOrder[b] ?? 99),
  );

  return (
    <nav aria-label="Documentation navigation">
      {Array.from(grouped.entries()).map(([section, entries]) => (
        <div key={section} className="mb-5">
          <h4 className="mb-2 type-label-100 text-muted-foreground">
            {section}
          </h4>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {entries.map((entry) => {
              const path = `/docs/${entry.slug}`;
              const isActive = location.pathname === path;
              return (
                <li key={entry.slug}>
                  <Link
                    to={path}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 type-body-100 no-underline transition ${
                      isActive
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {entry.frontmatter.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {sortedApiKinds.map((kind) => {
        const items = apiGrouped.get(kind)!;
        return (
          <div key={kind} className="mb-5">
            <h4 className="mb-2 type-label-100 text-muted-foreground">
              {kindLabels[kind] ?? kind}
            </h4>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {items.map((item) => {
                const path = `/docs/api/${item.name}`;
                const isActive = location.pathname === path;
                return (
                  <li key={item.name}>
                    <Link
                      to="/docs/api/$symbol"
                      params={{ symbol: item.name }}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-lg px-3 py-1.5 type-code-100 no-underline transition ${
                        isActive
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
