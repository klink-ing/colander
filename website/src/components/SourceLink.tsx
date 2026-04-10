import { Code } from "#/components/ui/code";
import { GITHUB_MAIN_BRANCH, GITHUB_REPO_URL } from "#/config";
import { AInline } from "./LinkInline";

const repoUrl = GITHUB_REPO_URL;
const branch = GITHUB_MAIN_BRANCH;

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
