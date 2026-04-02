import { Link } from "@tanstack/react-router";
import { NAV_LINKS } from "#/lib/nav-links";
import { useSectionNav } from "#/lib/use-section-nav";
import DocsNav from "./DocsNav";

function DocsNavSection() {
  const data = useSectionNav();
  if (!data) return null;
  return <DocsNav entries={data.entries} apiEntries={data.apiEntries} />;
}

export default function NavDrawerContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Site nav links — only visible below bp-4.5 (450px) */}
      <nav aria-label="Site navigation" className="bp-4.5:hidden">
        <ul className="m-0 list-none space-y-1 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {"external" in link ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg px-3 py-2 type-body-100 font-medium text-foreground no-underline transition hover:bg-accent"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.to}
                  className="block rounded-lg px-3 py-2 type-body-100 font-medium text-foreground no-underline transition hover:bg-accent"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Separator — only visible below bp-4.5, and only when docs nav is present */}
      <DocsNavSeparator />

      {/* Docs nav — always visible in drawer when on docs pages */}
      <DocsNavSection />
    </div>
  );
}

function DocsNavSeparator() {
  const data = useSectionNav();
  if (!data) return null;
  return <hr className="border-border bp-4.5:hidden" />;
}
