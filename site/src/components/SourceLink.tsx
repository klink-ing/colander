import { Code } from "#/components/ui/code";
import { AInline } from "./LinkInline";

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
    return <Code>{label}</Code>;
  }

  const href = `${repoUrl}/blob/${branch ?? "main"}/${filePath}#L${lineNumber}`;

  return (
    <AInline href={href} className="type-code-100">
      {label}
    </AInline>
  );
}
