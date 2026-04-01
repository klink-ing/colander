import { createContext, useContext, useState, type ReactNode } from "react";

const HeaderDrawerContentContext = createContext<ReactNode | null>(null);
const HeaderDrawerContentSetterContext = createContext<
  ((content: ReactNode | null) => void) | null
>(null);

export function HeaderDrawerContentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [drawerContent, setDrawerContent] = useState<ReactNode | null>(null);
  return (
    <HeaderDrawerContentContext.Provider value={drawerContent}>
      <HeaderDrawerContentSetterContext.Provider value={setDrawerContent}>
        {children}
      </HeaderDrawerContentSetterContext.Provider>
    </HeaderDrawerContentContext.Provider>
  );
}

export function useHeaderDrawerContent() {
  return useContext(HeaderDrawerContentContext);
}

export function useSetHeaderDrawerContent() {
  const setter = useContext(HeaderDrawerContentSetterContext);
  if (!setter) {
    throw new Error(
      "useSetHeaderDrawerContent must be used within HeaderDrawerContentProvider",
    );
  }
  return setter;
}
