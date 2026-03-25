export default function CodeBlock({
  children,
  'data-language': language,
}: {
  children: string
  'data-language'?: string
}) {
  return (
    <div className="my-4">
      {language && (
        <div className="type-code-100 rounded-t-lg border border-b-0 border-line bg-surface px-4 py-1.5 text-fg-muted">
          {language}
        </div>
      )}
      <pre
        className={`type-code-200 overflow-x-auto border border-line bg-surface-strong p-4 ${language ? 'rounded-b-lg' : 'rounded-lg'}`}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}
