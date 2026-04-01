import { Link } from "@tanstack/react-router";
import DocsNav, { type DocsNavEntry, type ApiDocsNavEntry } from "./DocsNav";

export default function DocsDrawerContent({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Site navigation">
        <ul className="m-0 list-none space-y-1 p-0">
          <li>
            <Link
              to="/"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/docs"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Docs
            </Link>
          </li>
          <li>
            <Link
              to="/demo"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Demo
            </Link>
          </li>
          <li>
            <a
              href={import.meta.env.VITE_GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              GitHub
            </a>
          </li>
        </ul>
      </nav>

      <hr className="border-border" />

      <DocsNav entries={entries} apiEntries={apiEntries} />
    </div>
  );
}
