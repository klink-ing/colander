import { Link } from "@tanstack/react-router";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import { NAV_LINKS } from "#/lib/nav-links";
import { useNavDrawer } from "#/lib/nav-drawer-context";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { setOpen } = useNavDrawer();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80  backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-x-3 py-3 bp-4.5:py-4">
        {/* Hamburger — visible below bp-4.5 */}
        <button
          type="button"
          data-nav-drawer-trigger
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-accent bp-4.5:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="m-0 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 type-body-100-bold text-foreground no-underline shadow-md bp-4.5:px-4 bp-4.5:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-accent" />
            {import.meta.env.VITE_PROJECT_NAME}
          </Link>
        </h2>

        {/* Desktop nav — hidden below bp-4.5, renders from NAV_LINKS */}
        <NavigationMenu viewport={false} className="hidden bp-4.5:flex">
          <NavigationMenuList className="gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink
                  render={<Link to={link.to} />}
                  className={navigationMenuTriggerStyle()}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5 bp-4.5:gap-2">
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="flex items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-accent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
