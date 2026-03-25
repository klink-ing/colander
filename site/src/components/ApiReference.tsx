import { getSymbolByName, type ApiSymbol } from '#/lib/api-data'

export default function ApiReference({ symbol: symbolName }: { symbol: string }) {
  const sym = getSymbolByName(symbolName)

  if (!sym) {
    return (
      <div className="my-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        Symbol <code>{symbolName}</code> not found in API data.
      </div>
    )
  }

  return (
    <div className="my-6">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-lg font-semibold text-[var(--sea-ink)]" id={sym.name}>
          {sym.name}
        </h3>
        <span className="rounded-md border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
          {sym.kind}
        </span>
      </div>
      {sym.description && (
        <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">{sym.description}</p>
      )}
      {sym.properties && sym.properties.length > 0 && <PropsTable symbol={sym} />}
      {sym.members && sym.members.length > 0 && <MembersTable symbol={sym} />}
      {sym.kind === 'function' && sym.parameters && <FunctionSignature symbol={sym} />}
      {sym.kind === 'hook' && <HookSignature symbol={sym} />}
    </div>
  )
}

function PropsTable({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th className="py-2 pr-4 text-left font-semibold text-[var(--sea-ink)]">Prop</th>
            <th className="py-2 pr-4 text-left font-semibold text-[var(--sea-ink)]">Type</th>
            <th className="py-2 pr-4 text-left font-semibold text-[var(--sea-ink)]">Default</th>
            <th className="py-2 text-left font-semibold text-[var(--sea-ink)]">Description</th>
          </tr>
        </thead>
        <tbody>
          {symbol.properties!.map((prop) => (
            <tr key={prop.name} className="border-b border-[var(--line)] last:border-0">
              <td className="py-2 pr-4 align-top">
                <code className="text-xs">{prop.name}</code>
                {!prop.optional && (
                  <span className="ml-1 text-[10px] font-bold text-red-500">*</span>
                )}
              </td>
              <td className="py-2 pr-4 align-top">
                <code className="text-xs text-[var(--lagoon-deep)]">{prop.type}</code>
              </td>
              <td className="py-2 pr-4 align-top text-xs text-[var(--sea-ink-soft)]">
                {prop.defaultValue ? <code className="text-xs">{prop.defaultValue}</code> : '—'}
              </td>
              <td className="py-2 align-top text-xs text-[var(--sea-ink-soft)]">
                {prop.description || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MembersTable({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]">Members</p>
      <div className="flex flex-wrap gap-2">
        {symbol.members!.map((member) => (
          <code
            key={member}
            className="rounded-md border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-1 text-xs"
          >
            {member}
          </code>
        ))}
      </div>
    </div>
  )
}

function FunctionSignature({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div className="overflow-x-auto">
      <pre className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
        <code>
          {symbol.name}({symbol.parameters?.map((p) => `${p.name}: ${p.type}`).join(', ')}
          ): {symbol.returnType}
        </code>
      </pre>
    </div>
  )
}

function HookSignature({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div className="overflow-x-auto">
      <pre className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
        <code>
          {symbol.name}(): {symbol.returnType}
        </code>
      </pre>
    </div>
  )
}
