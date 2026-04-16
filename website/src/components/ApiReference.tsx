import { useRender } from "@base-ui/react/use-render";
import React, { Fragment, useId, type ComponentProps } from "react";
import { type ApiSymbol } from "#/lib/api-data";
import { useApiData } from "#/lib/use-api-data";
import { cn } from "#/lib/utils";
import InlineDescription from "./InlineDescription";
import TypeLink from "./TypeLink";
import { Code } from "./ui/code";

const MDN_BASE = "https://developer.mozilla.org/en-US/docs/Web/HTML/Element";

/** Property entry with `type` resolved to its string form for display. */
interface DisplayProperty {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

export default function ApiReference({
  symbol: symbolName,
}: {
  symbol: string;
}) {
  const { symbols, types } = useApiData();
  const symbol = symbols.find((s) => s.name === symbolName);

  if (!symbol) {
    return (
      <div className="border-callout-error-border bg-callout-error-bg text-callout-error-text my-4 squircle-lg border p-4 type-body-100">
        Symbol <Code>{symbolName}</Code> not found in API data.
      </div>
    );
  }

  return (
    <div className="my-6">
      {symbol.defaultElement && <DefaultElement symbol={symbol} />}
      {(symbol.properties?.length || symbol.defaultElement) && (
        <PropsTable symbol={symbol} types={types} />
      )}
      {symbol.members && symbol.members.length > 0 && (
        <MembersTable symbol={symbol} />
      )}
      {symbol.kind === "function" && symbol.parameters && (
        <FunctionSignature symbol={symbol} types={types} />
      )}
      {symbol.kind === "hook" && (
        <HookSignature symbol={symbol} types={types} />
      )}
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

function buildRenderPropType(symbol: ApiSymbol, types: string[]): string {
  const el = symbol.defaultElement!;
  const state = symbol.stateType !== undefined ? types[symbol.stateType] : "";
  return `ReactElement | ((props: HTMLProps<${el}>, state: ${state}) => ReactElement)`;
}

function PropsTable({ symbol, types }: { symbol: ApiSymbol; types: string[] }) {
  const ownProps: DisplayProperty[] = (symbol.properties ?? []).map((p) => ({
    ...p,
    type: types[p.type],
  }));
  const propId = `${symbol.name}-${useId()}`;

  // Build the render prop entry if this type uses ComponentProps
  const renderProp: DisplayProperty | null = symbol.defaultElement
    ? {
        name: "render",
        type: buildRenderPropType(symbol, types),
        description: `Custom render function or element. Receives HTML props for <${symbol.defaultElement}> and component state.`,
        optional: true,
      }
    : null;

  const allProps = renderProp ? [renderProp, ...ownProps] : ownProps;

  if (allProps.length === 0) return null;

  return (
    <table
      className="grid w-full border-collapse grid-cols-[auto_1fr_auto] overflow-x-auto type-body-100"
      aria-label={`${symbol.name} props`}
    >
      <thead className="contents border-none">
        <tr className="contents">
          <Th id={propId}>Prop</Th>
          <Th headers={propId}>Type</Th>
          <Th headers={propId}>Default</Th>
          <Th headers={propId} className="sr-only">
            Description
          </Th>
        </tr>
      </thead>
      <tbody className="contents">
        {allProps.map((prop) => {
          return (
            <Fragment key={prop.name}>
              <tr
                key={prop.name}
                className="col-span-full grid grid-cols-subgrid border-t border-border"
              >
                <Cell className="border-0 pb-3">
                  <Badge>
                    {prop.name}
                    {!prop.optional && (
                      <span className="relative top-[-.25em] ml-0.5 text-muted-foreground">
                        *
                      </span>
                    )}
                  </Badge>
                </Cell>
                <Cell className="border-0 pb-3 type-code-100 wrap-break-word text-muted-foreground">
                  <TypeLink type={prop.type} />
                </Cell>
                <Cell
                  className="border-0 pb-3 type-code-100 text-muted-foreground"
                  lastInRow
                >
                  {prop.defaultValue || "—"}
                </Cell>
                <Cell className="col-start-2 -col-end-1 pt-0">
                  <InlineDescription text={prop.description} />
                </Cell>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({
  children,
  lastInRow = false,
  ...props
}: {
  children: React.ReactNode;
  lastInRow?: boolean;
} & ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "pb-1 text-left type-label-200 text-muted-foreground",
        !lastInRow && "pr-4",
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function Cell({
  children,
  lastInRow = false,
  className,
  ...props
}: {
  children: React.ReactNode;
  isLast?: boolean;
  lastInRow?: boolean;
  className?: string;
} & ComponentProps<"td">) {
  return (
    <td className={cn("py-5", !lastInRow && "pr-4", className)} {...props}>
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
            className="squircle-md border border-border bg-secondary px-2 py-1"
          >
            {member}
          </Code>
        ))}
      </div>
    </div>
  );
}

function FunctionSignature({
  symbol,
  types,
}: {
  symbol: ApiSymbol;
  types: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <pre className="squircle-lg border border-border bg-card p-4">
        <Code size={200}>
          {symbol.name}(
          {symbol.parameters?.map((p, i) => (
            <React.Fragment key={p.name}>
              {i > 0 && ", "}
              {p.name}: <TypeLink type={types[p.type]} />
            </React.Fragment>
          ))}
          ):{" "}
          {symbol.returnType !== undefined && (
            <TypeLink type={types[symbol.returnType]} />
          )}
        </Code>
      </pre>
    </div>
  );
}

function HookSignature({
  symbol,
  types,
}: {
  symbol: ApiSymbol;
  types: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <pre className="squircle-lg border border-border bg-card p-4">
        <Code size={200}>
          {symbol.name}():{" "}
          {symbol.returnType !== undefined && (
            <TypeLink type={types[symbol.returnType]} />
          )}
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
        "type-code-100 inline-flex items-center squircle-md border border-border bg-accent px-1.5 py-0.5 text-foreground",
      children,
    },
    defaultTagName: "span",
  });
}
