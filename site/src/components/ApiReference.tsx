import { useRender } from "@base-ui/react/use-render";
import React from "react";
import {
  getSymbolByName,
  type ApiSymbol,
  type SymbolProperty,
} from "#/lib/api-data";
import { cn } from "#/lib/utils";
import InlineDescription from "./InlineDescription";
import TypeLink from "./TypeLink";
import { Code } from "./ui/code";

const MDN_BASE = "https://developer.mozilla.org/en-US/docs/Web/HTML/Element";

export default function ApiReference({
  symbol: symbolName,
}: {
  symbol: string;
}) {
  const sym = getSymbolByName(symbolName);

  if (!sym) {
    return (
      <div className="border-callout-error-border bg-callout-error-bg text-callout-error-text my-4 rounded-lg border p-4 type-body-100">
        Symbol <Code>{symbolName}</Code> not found in API data.
      </div>
    );
  }

  return (
    <div className="my-6">
      {sym.defaultElement && <DefaultElement symbol={sym} />}
      {(sym.properties?.length || sym.defaultElement) && (
        <PropsTable symbol={sym} />
      )}
      {sym.members && sym.members.length > 0 && <MembersTable symbol={sym} />}
      {sym.kind === "function" && sym.parameters && (
        <FunctionSignature symbol={sym} />
      )}
      {sym.kind === "hook" && <HookSignature symbol={sym} />}
    </div>
  );
}

function DefaultElement({ symbol }: { symbol: ApiSymbol }) {
  const el = symbol.defaultElement!;
  return (
    <p className="mb-4 type-body-100 text-muted-foreground">
      Renders as{" "}
      <a
        href={`${MDN_BASE}/${el}`}
        target="_blank"
        rel="noopener noreferrer"
        className="type-code-100 no-underline hover:underline"
      >
        &lt;{el}&gt;
      </a>{" "}
      by default. Use the{" "}
      <Badge
        render={
          <a
            href="https://base-ui.com/react/handbook/styling#the-render-prop"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:border-primary"
          />
        }
      >
        render
      </Badge>{" "}
      prop to override.
    </p>
  );
}

function renderPropType(symbol: ApiSymbol): string {
  const el = symbol.defaultElement!;
  const state = symbol.stateType!;
  return `ReactElement | ((props: HTMLProps<${el}>, state: ${state}) => ReactElement)`;
}

function PropsTable({ symbol }: { symbol: ApiSymbol }) {
  const ownProps = symbol.properties ?? [];

  // Build the render prop entry if this type uses ComponentProps
  const renderProp: SymbolProperty | null = symbol.defaultElement
    ? {
        name: "render",
        type: renderPropType(symbol),
        description: `Custom render function or element. Receives HTML props for <${symbol.defaultElement}> and component state.`,
        optional: true,
      }
    : null;

  const allProps = renderProp ? [renderProp, ...ownProps] : ownProps;

  if (allProps.length === 0) return null;

  return (
    <table
      className="grid w-full border-collapse grid-cols-[auto_1fr_auto_1fr] overflow-x-auto type-body-100"
      aria-label={`${symbol.name} props`}
    >
      <thead className="contents">
        <tr className="contents">
          <Th>Prop</Th>
          <Th>Type</Th>
          <Th>Default</Th>
          <Th lastInRow>Description</Th>
        </tr>
      </thead>
      <tbody className="contents">
        {allProps.map((prop, i) => {
          const isLast = i === allProps.length - 1;
          return (
            <tr key={prop.name} className="contents">
              <Cell isLast={isLast}>
                <Badge>
                  {prop.name}
                  {!prop.optional && (
                    <span className="relative top-[-.25em] ml-0.5 text-muted-foreground">
                      *
                    </span>
                  )}
                </Badge>
              </Cell>
              <Cell
                isLast={isLast}
                className="type-code-100 break-all text-muted-foreground"
              >
                <TypeLink type={prop.type} />
              </Cell>
              <Cell
                isLast={isLast}
                className="type-code-100 text-muted-foreground"
              >
                {prop.defaultValue || "—"}
              </Cell>
              <Cell
                isLast={isLast}
                className="type-body-100 text-muted-foreground"
                lastInRow
              >
                <InlineDescription text={prop.description} />
              </Cell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({
  children,
  lastInRow = false,
}: {
  children: React.ReactNode;
  lastInRow?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border pb-1 text-left type-label-200 text-muted-foreground",
        !lastInRow && "pr-4",
      )}
    >
      {children}
    </th>
  );
}

function Cell({
  children,
  isLast = false,
  lastInRow = false,
  className,
}: {
  children: React.ReactNode;
  isLast?: boolean;
  lastInRow?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "py-1.5",
        !lastInRow && "pr-4",
        !isLast && "border-b border-border",
        className,
      )}
    >
      {children}
    </td>
  );
}

function MembersTable({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div>
      <p className="mb-2 type-body-100-bold text-foreground">Members</p>
      <div className="flex flex-wrap gap-2">
        {symbol.members!.map((member) => (
          <Code
            key={member}
            className="rounded-md border border-border bg-secondary px-2 py-1"
          >
            {member}
          </Code>
        ))}
      </div>
    </div>
  );
}

function FunctionSignature({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div className="overflow-x-auto">
      <pre className="rounded-lg border border-border bg-card p-4">
        <Code size={200}>
          {symbol.name}(
          {symbol.parameters?.map((p, i) => (
            <React.Fragment key={p.name}>
              {i > 0 && ", "}
              {p.name}: <TypeLink type={p.type} />
            </React.Fragment>
          ))}
          ): {symbol.returnType && <TypeLink type={symbol.returnType} />}
        </Code>
      </pre>
    </div>
  );
}

function HookSignature({ symbol }: { symbol: ApiSymbol }) {
  return (
    <div className="overflow-x-auto">
      <pre className="rounded-lg border border-border bg-card p-4">
        <Code size={200}>
          {symbol.name}():{" "}
          {symbol.returnType && <TypeLink type={symbol.returnType} />}
        </Code>
      </pre>
    </div>
  );
}

type BadgeState = Record<string, unknown>;

function Badge({
  children,
  render,
}: {
  children: React.ReactNode;
  render?: useRender.RenderProp<BadgeState>;
}) {
  return useRender<BadgeState, HTMLSpanElement>({
    render: render ?? <span />,
    state: {},
    props: {
      className:
        "type-code-100 inline-flex items-center rounded-md border border-border bg-accent px-1.5 py-0.5 text-foreground",
      children,
    },
    defaultTagName: "span",
  });
}
