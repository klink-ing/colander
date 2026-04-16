import { useMatch } from "@tanstack/react-router";
import type { ApiData } from "./api-data";

export function useApiData(): ApiData {
  return useMatch({
    from: "/docs",
    select: (s) =>
      (s as { loaderData: { apiData: ApiData } }).loaderData.apiData,
  });
}
