import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import { useHeaderDrawerContent } from "#/lib/header-drawer-context";
import NavDrawer from "./NavDrawer";
import ThemeToggle from "./ThemeToggle";

function HeaderNavLinks() {
  return (
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
  );
}

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerContent = useHeaderDrawerContent();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-x-3 py-3 bp-4.5:py-4">
        {/* Hamburger — visible below bp-4.5 */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
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

        {/* Desktop nav — hidden below bp-4.5 */}
        <NavigationMenu viewport={false} className="hidden bp-4.5:flex">
          <NavigationMenuList className="gap-0.5">
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/" />}
                className={navigationMenuTriggerStyle()}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/docs" />}
                className={navigationMenuTriggerStyle()}
              >
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/demo" />}
                className={navigationMenuTriggerStyle()}
              >
                Demo
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5 bp-4.5:gap-2">
          {/* GitHub — hidden below bp-4.5 */}
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground bp-4.5:block"
          >
            <span className="sr-only">{`${import.meta.env.VITE_PROJECT_NAME} on GitHub`}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>

          <ThemeToggle />
        </div>
      </nav>

      {/* Drawer for narrow screens */}
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        {drawerContent ?? <HeaderNavLinks />}
      </NavDrawer>
    </header>
  );
}
