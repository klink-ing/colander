import { LinkInline } from "./LinkInline";

const repoUrl = import.meta.env.VITE_GITHUB_REPO_URL as string | undefined;
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
    return <code>{label}</code>;
  }

  const href = `${repoUrl}/blob/${branch ?? "main"}/${filePath}#L${lineNumber}`;

  return (
    <LinkInline href={href} target="_blank" className="type-code-100">
      {label}
    </LinkInline>
  );
}
