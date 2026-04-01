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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 px-4 backdrop-blur-lg">
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
                {"external" in link ? (
                  <NavigationMenuLink
                    render={
                      <a href={link.href} target="_blank" rel="noreferrer" />
                    }
                    className={navigationMenuTriggerStyle()}
                  >
                    {link.label}
                  </NavigationMenuLink>
                ) : (
                  <NavigationMenuLink
                    render={<Link to={link.to} />}
                    className={navigationMenuTriggerStyle()}
                  >
                    {link.label}
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5 bp-4.5:gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
