import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export default function NavDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    return router.subscribe("onBeforeNavigate", () => {
      onOpenChange(false);
    });
  }, [open, router, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-[60] bg-black/50 opacity-0 transition-opacity duration-200 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        />
        <Dialog.Popup
          aria-label="Navigation"
          className="fixed inset-y-0 left-0 z-[60] w-72 -translate-x-full overflow-y-auto bg-background p-6 shadow-xl transition-transform duration-200 ease-out data-[open]:translate-x-0 data-[ending-style]:-translate-x-full data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
