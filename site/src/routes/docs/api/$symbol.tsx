import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import ApiReference from '#/components/ApiReference'
import SourceLink from '#/components/SourceLink'
import { getAllSymbols } from '#/lib/api-data'

const getSymbolData = createServerFn()
  .inputValidator((name: unknown) => name as string)
  .handler(async ({ data: name }) => {
    const symbols = getAllSymbols()
    const sym = symbols.find((s) => s.name === name)
    if (!sym) throw notFound()
    return sym
  })

export const Route = createFileRoute('/docs/api/$symbol')({
  loader: ({ params }) => getSymbolData({ data: params.symbol }),
  notFoundComponent: () => (
    <div className="py-12 text-center">
      <h1 className="type-heading-300 mb-2 text-fg">Symbol not found</h1>
      <p className="type-body-200 text-fg-muted">
        The API symbol you requested does not exist.
      </p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? 'API'} - ${import.meta.env.VITE_PROJECT_NAME}` },
      ...(loaderData?.description
        ? [{ name: 'description', content: loaderData.description }]
        : []),
    ],
  }),
  component: ApiSymbolPage,
})

function ApiSymbolPage() {
  const sym = Route.useLoaderData()

  return (
    <div>
      <div className="mb-6">
        <p className="type-label-100 text-kicker mb-1">API Reference</p>
        <div className="flex items-baseline gap-3">
          <h1 className="type-display-100 text-fg">{sym.name}</h1>
          <span className="type-code-100 rounded-md border border-chip-line bg-chip-bg px-2 py-0.5 text-fg-muted">
            {sym.kind}
          </span>
        </div>
        {sym.description && (
          <p className="type-body-200 mt-2 text-fg-muted">{sym.description}</p>
        )}
        {sym.filePath && (
          <p className="type-code-100 mt-1 text-fg-muted">
            Defined in{' '}
            <SourceLink filePath={sym.filePath} lineNumber={sym.lineNumber} />
          </p>
        )}
      </div>
      <ApiReference symbol={sym.name} />
    </div>
  )
}
