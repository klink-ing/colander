import { Code } from "#/components/ui/code";

export default function CodeBlock({
  children,
  "data-language": language,
}: {
  children: string;
  "data-language"?: string;
}) {
  return (
    <div className="my-4">
      {language && (
        <div className="rounded-t-lg border border-b-0 border-border bg-card px-4 py-1.5 type-code-100 text-muted-foreground">
          {language}
        </div>
      )}
      <pre
        className={`overflow-x-auto border border-border bg-muted p-4 type-code-200 ${language ? "rounded-b-lg" : "rounded-lg"}`}
      >
        <Code size={200}>{children}</Code>
      </pre>
    </div>
  );
}
