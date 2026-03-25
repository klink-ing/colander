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
    <div className="overflow-x-auto" role="table" aria-label={`${symbol.name} props`}>
      {/* Header row */}
      <div
        className="hidden grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-2 text-sm sm:grid"
        role="row"
      >
        <div role="columnheader" className="font-semibold text-[var(--sea-ink-soft)] text-xs uppercase tracking-wider pb-1 border-b border-[var(--line)]">Prop</div>
        <div role="columnheader" className="font-semibold text-[var(--sea-ink-soft)] text-xs uppercase tracking-wider pb-1 border-b border-[var(--line)]">Type</div>
        <div role="columnheader" className="font-semibold text-[var(--sea-ink-soft)] text-xs uppercase tracking-wider pb-1 border-b border-[var(--line)]">Default</div>
        <div role="columnheader" className="font-semibold text-[var(--sea-ink-soft)] text-xs uppercase tracking-wider pb-1 border-b border-[var(--line)]">Description</div>
      </div>
      {/* Data rows — grid on sm+, stacked on mobile */}
      {properties.map((prop) => (
        <div
          key={prop.name}
          role="row"
          className="grid grid-cols-1 gap-x-4 gap-y-0.5 border-b border-[var(--line)] py-2 text-sm last:border-0 sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-y-2 sm:py-0"
        >
          <div role="cell" className="font-mono text-xs py-1.5">
            {prop.name}
            {!prop.optional && <span className="ml-0.5 text-[var(--accent)]">*</span>}
          </div>
          <div role="cell" className="font-mono text-xs text-[var(--sea-ink-soft)] py-1.5 break-all">{prop.type}</div>
          <div role="cell" className="font-mono text-xs text-[var(--sea-ink-soft)] py-1.5">{prop.defaultValue || '—'}</div>
          <div role="cell" className="text-xs text-[var(--sea-ink-soft)] py-1.5">{prop.description}</div>
        </div>
      ))}
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
