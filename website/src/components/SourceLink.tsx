import { Code } from "#/components/ui/code";
import { LinkInline, type AllowedExternalHref } from "./LinkInline";

const repoUrl = import.meta.env.VITE_GITHUB_REPO_URL as
  | AllowedExternalHref
  | undefined;
const branch = import.meta.env.VITE_GITHUB_MAIN_BRANCH as string | undefined;

export default function SourceLink({
  filePath,
  lineNumber,
}: {
  filePath: string;
  lineNumber: number;
}) {
  const label = `${filePath}:${lineNumber}`;

  if (!repoUrl) {
    return <Code>{label}</Code>;
  }

  const href =
    `${repoUrl}/blob/${branch ?? "main"}/${filePath}#L${lineNumber}` as const;

  return (
    <LinkInline href={href} className="type-code-100">
      {label}
    </LinkInline>
  );
}
