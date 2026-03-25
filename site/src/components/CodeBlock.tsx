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
        <div className="rounded-t-lg border border-b-0 border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)]">
          {language}
        </div>
      )}
      <pre
        className={`overflow-x-auto border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm leading-relaxed ${language ? 'rounded-b-lg' : 'rounded-lg'}`}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}
