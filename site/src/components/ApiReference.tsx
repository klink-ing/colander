import React from 'react'
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
  const properties = symbol.properties!

  return (
    <table
      className="w-full border-collapse overflow-x-auto text-sm [display:grid] [grid-template-columns:auto_1fr_auto_1fr]"
      aria-label={`${symbol.name} props`}
    >
      <thead className="contents">
        <tr className="contents">
          <th scope="col" className="border-b border-[var(--line)] pb-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Prop</th>
          <th scope="col" className="border-b border-[var(--line)] pb-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Type</th>
          <th scope="col" className="border-b border-[var(--line)] pb-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Default</th>
          <th scope="col" className="border-b border-[var(--line)] pb-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Description</th>
        </tr>
      </thead>
      <tbody className="contents">
        {properties.map((prop) => (
          <tr key={prop.name} className="contents">
            <td className="border-b border-[var(--line)] py-1.5 pr-4 last:border-0">
              <Badge>
                {prop.name}
                {!prop.optional && <span className="ml-0.5 text-[var(--accent)]">*</span>}
              </Badge>
            </td>
            <td className="break-all border-b border-[var(--line)] py-1.5 pr-4 font-mono text-xs text-[var(--sea-ink-soft)] last:border-0">{prop.type}</td>
            <td className="border-b border-[var(--line)] py-1.5 pr-4 font-mono text-xs text-[var(--sea-ink-soft)] last:border-0">{prop.defaultValue || '—'}</td>
            <td className="border-b border-[var(--line)] py-1.5 text-sm text-[var(--sea-ink-soft)] last:border-0">{prop.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--chip-line)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--sea-ink)]">
      {children}
    </span>
  )
}
