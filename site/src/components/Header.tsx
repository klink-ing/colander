import { Link, useLocation } from "@tanstack/react-router";
import heroImage from "#/assets/colander.png?width=100";
import { GithubIcon } from "#/components/icons/GithubIcon";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import { useNavDrawer } from "#/lib/nav-drawer-context";
import { NAV_LINKS } from "#/lib/nav-links";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { setOpen } = useNavDrawer();
  const pathname = useLocation({ select: (l) => l.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-x-3 py-3 bp-4.5:py-4">
        {/* Hamburger — visible below bp-4.5 */}
        <button
          type="button"
          data-nav-drawer-trigger
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-accent bp-4.5:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 className="m-0 shrink-0">
          <Link
            to="/"
            className="h-full flex items-center gap-2 pr-3 no-underline -my-2"
          >
            <img
              src={heroImage.src}
              width={heroImage.width}
              height={heroImage.height}
              alt=""
              className="h-auto w-14"
            />
            <span className="sr-only">{import.meta.env.VITE_PROJECT_NAME}</span>
          </Link>
        </h2>

        {/* Desktop nav — hidden below bp-4.5, renders from NAV_LINKS */}
        <NavigationMenu viewport={false} className="hidden bp-4.5:flex">
          <NavigationMenuList className="gap-0.5">
            {NAV_LINKS.map((link) => {
              const active =
                link.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.to);
              return (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink
                    render={<Link to={link.to} />}
                    className={navigationMenuTriggerStyle()}
                    active={active}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
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
            <GithubIcon className="size-5" />
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
