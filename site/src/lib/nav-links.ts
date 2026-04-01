export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Docs", to: "/docs" },
  { label: "Demo", to: "/demo" },
  { label: "GitHub", href: import.meta.env.VITE_GITHUB_REPO_URL, external: true },
] as const;
