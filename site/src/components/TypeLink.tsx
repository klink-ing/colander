import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "#/components/ui/tooltip";
import { isKnownSymbol, getSymbolByName } from "#/lib/api-data";
import { LinkInline } from "./LinkInline";

/**
 * Parses a type string and turns recognized symbol names into links
 * with VS Code-style hover tooltips showing type details.
 */
export default function TypeLink({ type }: { type: string }) {
  const parts = tokenize(type);

  return (
    <>
      {parts.map((part, i) =>
        part.linked ? (
          <SymbolLink key={i} name={part.text} />
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function SymbolLink({ name }: { name: string }) {
  const sym = getSymbolByName(name);
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

function TypeTooltipBody({
  symbol,
}: {
  symbol: NonNullable<ReturnType<typeof getSymbolByName>>;
}) {
  const maxProps = 6;

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 inline wrap-break-word">
        <span className="type-code-100 text-foreground-vivid pr-[1em]">
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

/** Split a type string into linkable identifiers and plain text fragments. */
function tokenize(type: string): Token[] {
  const regex = /([A-Z][A-Za-z0-9]*)/g;
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of type.matchAll(regex)) {
    const start = match.index!;
    if (start > lastIndex) {
      tokens.push({ text: type.slice(lastIndex, start), linked: false });
    }
    const name = match[1];
    tokens.push({ text: name, linked: isKnownSymbol(name) });
    lastIndex = start + name.length;
  }

  if (lastIndex < type.length) {
    tokens.push({ text: type.slice(lastIndex), linked: false });
  }

  return tokens;
}
