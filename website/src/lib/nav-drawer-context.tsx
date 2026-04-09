import { createContext, useContext, useState, type ReactNode } from "react";

interface NavDrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const NavDrawerContext = createContext<NavDrawerContextValue | null>(null);

export function NavDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <NavDrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </NavDrawerContext.Provider>
  );
}

export function useNavDrawer() {
  const ctx = useContext(NavDrawerContext);
  if (!ctx) {
    throw new Error("useNavDrawer must be used within NavDrawerProvider");
  }
  return ctx;
}
