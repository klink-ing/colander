import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavDrawer } from "#/lib/nav-drawer-context";
import { useSectionNav } from "#/lib/use-section-nav";

export default function NavDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useNavDrawer();
  const router = useRouter();
  const sectionNav = useSectionNav();

  // Close on route change
  useEffect(() => {
    if (!open) return;
    return router.subscribe("onBeforeNavigate", () => {
      setOpen(false);
    });
  }, [open, router, setOpen]);

  // Auto-close when viewport crosses the threshold where the trigger disappears
  // On docs pages: bp-6 (600px / 37.5rem) — sidebar becomes inline
  // On non-docs pages: bp-4.5 (450px / 28.125rem) — hamburger disappears
  useEffect(() => {
    const breakpoint = sectionNav ? "37.5rem" : "28.125rem";
    const mql = window.matchMedia(`(min-width: ${breakpoint})`);
    const handler = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [sectionNav, setOpen]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-[60] bg-black/50 opacity-0 transition-opacity duration-200 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        />
        <Dialog.Popup
          aria-label="Navigation"
          finalFocus={() => {
            const triggers = document.querySelectorAll<HTMLElement>(
              "[data-nav-drawer-trigger]",
            );
            for (const el of triggers) {
              if (el.offsetParent !== null) return el;
            }
            return false;
          }}
          className="fixed inset-y-0 left-0 z-[60] w-72 -translate-x-full overflow-y-auto bg-background p-6 shadow-xl transition-transform duration-200 ease-out data-[open]:translate-x-0 data-[ending-style]:-translate-x-full data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
