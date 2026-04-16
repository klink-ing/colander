import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ApiReference from "#/components/ApiReference";
import InlineDescription from "#/components/InlineDescription";
import SourceLink from "#/components/SourceLink";
import { PROJECT_NAME } from "#/config";
import { getAllSymbols } from "#/lib/api-data";

const getSymbolData = createServerFn()
  .inputValidator((name: unknown) => name as string)
  .handler(async ({ data: name }) => {
    const symbols = getAllSymbols();
    const sym = symbols.find((s) => s.name === name);
    if (!sym) throw notFound();
    return sym;
  });

export const Route = createFileRoute("/docs/api/$symbol")({
  loader: ({ params }) => getSymbolData({ data: params.symbol }),
  notFoundComponent: () => (
    <div className="py-12 text-center">
      <h1 className="mb-2 type-heading-300 text-foreground">
        Symbol not found
      </h1>
      <p className="type-body-200 text-muted-foreground">
        The API symbol you requested does not exist.
      </p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name ?? "API"} - ${PROJECT_NAME}`,
      },
      ...(loaderData?.description
        ? [{ name: "description", content: loaderData.description }]
        : []),
    ],
  }),
  component: ApiSymbolPage,
});

function ApiSymbolPage() {
  const sym = Route.useLoaderData();

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 type-label-100 text-muted-foreground">
          API Reference
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="type-heading-300 text-foreground">{sym.name}</h1>
          <span className="squircle-md border border-border bg-secondary px-2 py-0.5 type-code-100 text-muted-foreground">
            {sym.kind}
          </span>
        </div>
        {sym.description && (
          <p className="mt-2 type-body-200 text-muted-foreground">
            <InlineDescription text={sym.description} codeSize={200} />
          </p>
        )}
        {sym.filePath && (
          <p className="mt-1 type-code-100 text-muted-foreground">
            Defined in{" "}
            <SourceLink filePath={sym.filePath} lineNumber={sym.lineNumber} />
          </p>
        )}
      </div>
      <ApiReference symbol={sym} />
    </div>
  );
}
