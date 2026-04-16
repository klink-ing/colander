import { useMatch } from "@tanstack/react-router";
import type { ApiSymbol } from "./api-data";

export function useDocsSymbols(): ApiSymbol[] {
  return useMatch({
    from: "/docs",
    select: (s) =>
      (s as { loaderData: { symbols: ApiSymbol[] } }).loaderData.symbols,
  });
}
