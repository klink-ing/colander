/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_NAME: string;
  readonly VITE_PACKAGE_NAME: string;
  readonly VITE_GITHUB_REPO_URL: string;
  readonly VITE_GITHUB_MAIN_BRANCH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
