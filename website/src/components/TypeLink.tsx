import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "#/components/ui/tooltip";
import type { ApiSymbol } from "#/lib/api-data";
import { useDocsSymbols } from "#/lib/use-docs-symbols";
import { LinkInline } from "./LinkInline";

export default function TypeLink({ type }: { type: string }) {
  const symbols = useDocsSymbols();
  const parts = tokenize(type, symbols);

  return (
    <>
      {parts.map((part, i) =>
        part.linked ? (
          <SymbolLink key={i} name={part.text} symbols={symbols} />
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function SymbolLink({ name, symbols }: { name: string; symbols: ApiSymbol[] }) {
  const sym = symbols.find((s) => s.name === name);
  const linkClassName = "no-underline hover:underline";

  if (!sym) {
    return (
      <LinkInline
        to="/docs/api/$symbol"
        params={{ symbol: name }}
        className={linkClassName}
      >
        {name}
      </LinkInline>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <LinkInline
            to="/docs/api/$symbol"
            params={{ symbol: name }}
            className={linkClassName}
          />
        }
      >
        {name}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-sm squircle-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      >
        <TypeTooltipBody symbol={sym} />
      </TooltipContent>
    </Tooltip>
  );
}

function TypeTooltipBody({ symbol }: { symbol: ApiSymbol }) {
  const maxProps = 6;

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 inline wrap-break-word">
        <span className="pr-[1em] type-code-100 text-foreground-vivid">
          {symbol.kind}
        </span>
        <span className="type-code-100 font-semibold text-foreground">
          {symbol.name}
        </span>
      </div>

      {symbol.description && (
        <p className="m-0 mb-2 type-body-100 text-muted-foreground">
          {symbol.description}
        </p>
      )}

      {symbol.typeText && !symbol.properties?.length && (
        <pre className="m-0 type-code-100 whitespace-pre-wrap text-muted-foreground">
          {symbol.typeText}
        </pre>
      )}

      {symbol.properties && symbol.properties.length > 0 && (
        <pre className="m-0 type-code-100 whitespace-pre-wrap text-muted-foreground">
          {"{"}
          {symbol.properties.slice(0, maxProps).map((p) => (
            <div key={p.name} className="pl-3">
              <span className="text-foreground">{p.name}</span>
              {p.optional ? "?" : ""}: {p.type}
            </div>
          ))}
          {symbol.properties.length > maxProps && (
            <div className="pl-3 text-muted-foreground">
              // ... {symbol.properties.length - maxProps} more
            </div>
          )}
          {"}"}
        </pre>
      )}

      {symbol.members && symbol.members.length > 0 && (
        <pre className="m-0 type-code-100 whitespace-pre-wrap text-muted-foreground">
          {symbol.members.join(" | ")}
        </pre>
      )}
    </div>
  );
}

interface Token {
  text: string;
  linked: boolean;
}

function tokenize(type: string, symbols: ApiSymbol[]): Token[] {
  const symbolNames = new Set(symbols.map((s) => s.name));
  const regex = /([A-Z][A-Za-z0-9]*)/g;
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of type.matchAll(regex)) {
    const start = match.index!;
    if (start > lastIndex) {
      tokens.push({ text: type.slice(lastIndex, start), linked: false });
    }
    const name = match[1];
    tokens.push({ text: name, linked: symbolNames.has(name) });
    lastIndex = start + name.length;
  }

  if (lastIndex < type.length) {
    tokens.push({ text: type.slice(lastIndex), linked: false });
  }

  return tokens;
}
