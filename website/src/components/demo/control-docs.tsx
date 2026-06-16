import { createContext, useContext, useMemo } from "react";
import InlineDescription from "#/components/InlineDescription";
import { Code } from "#/components/ui/code";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import type { ApiData } from "#/lib/api-data";

/**
 * Maps each demo control to the library symbol + property whose TSDoc documents
 * it. The tooltip text is pulled live from the generated API data
 * (`api-data/symbols.gen.json`), so it always mirrors the source TSDoc.
 *
 * `rangeMode`/`preventRangeReversal` are only documented on the stable context
 * value (they live on a selection-mode union, not the base provider props), so
 * they reference `CalendarStableContextValue`.
 */
const CONTROL_DOC_MAP = {
  rangeMode: { symbol: "CalendarStableContextValue", prop: "rangeMode" },
  preventRangeReversal: {
    symbol: "CalendarStableContextValue",
    prop: "preventRangeReversal",
  },
  timeZone: { symbol: "CalendarProviderProps", prop: "timeZone" },
  locale: { symbol: "CalendarProviderProps", prop: "locale" },
  weekStartDay: { symbol: "CalendarProviderProps", prop: "weekStartDay" },
  min: { symbol: "CalendarProviderProps", prop: "min" },
  max: { symbol: "CalendarProviderProps", prop: "max" },
  disabled: { symbol: "CalendarProviderProps", prop: "disabled" },
  readOnly: { symbol: "CalendarProviderProps", prop: "readOnly" },
  isDateDisabled: { symbol: "CalendarProviderProps", prop: "isDateDisabled" },
  numberOfMonths: { symbol: "MonthViewRootProps", prop: "numberOfMonths" },
  outsideDays: { symbol: "MonthViewRootProps", prop: "outsideDays" },
  fixedWeeks: { symbol: "MonthViewRootProps", prop: "fixedWeeks" },
  monthOutOfRangeBehavior: {
    symbol: "MonthViewRootProps",
    prop: "outOfRangeBehavior",
  },
  weekCount: { symbol: "WeeksViewRootProps", prop: "weekCount" },
  scrollBy: { symbol: "WeeksViewRootProps", prop: "scrollBy" },
  weeksOutOfRangeBehavior: {
    symbol: "WeeksViewRootProps",
    prop: "outOfRangeBehavior",
  },
  autoFocus: { symbol: "GridProps", prop: "autoFocus" },
  orientation: { symbol: "GridProps", prop: "orientation" },
} as const satisfies Record<string, { symbol: string; prop: string }>;

export type ControlKey = keyof typeof CONTROL_DOC_MAP;

interface ResolvedDoc {
  description: string;
  defaultValue?: string;
}

const ApiDataContext = createContext<ApiData | null>(null);

/** Provides the generated API data to descendant {@link ControlInfo} icons. */
export function ControlDocsProvider({
  apiData,
  children,
}: {
  apiData: ApiData;
  children: React.ReactNode;
}) {
  return (
    <ApiDataContext.Provider value={apiData}>
      {children}
    </ApiDataContext.Provider>
  );
}

function useControlDoc(control: ControlKey): ResolvedDoc | null {
  const apiData = useContext(ApiDataContext);
  return useMemo(() => {
    if (!apiData) return null;
    const ref = CONTROL_DOC_MAP[control];
    const symbol = apiData.symbols.find((s) => s.name === ref.symbol);
    const prop = symbol?.properties?.find((p) => p.name === ref.prop);
    if (!prop?.description.trim()) return null;
    return { description: prop.description, defaultValue: prop.defaultValue };
  }, [apiData, control]);
}

const infoIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M8 7.4v3.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="8" cy="5.2" r="0.85" fill="currentColor" />
  </svg>
);

/**
 * Info icon rendered next to a demo control label. On hover/focus it reveals the
 * library's TSDoc for the mapped prop. Renders nothing when the prop has no
 * extracted documentation, so undocumented/demo-only controls stay icon-free.
 */
export function ControlInfo({ control }: { control: ControlKey }) {
  const doc = useControlDoc(control);
  if (!doc) return null;

  const { prop } = CONTROL_DOC_MAP[control];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`What does ${prop} do?`}
            className="inline-flex shrink-0 cursor-help items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          >
            {infoIcon}
          </button>
        }
      />
      <TooltipContent>
        <div className="max-w-72 py-0.5 leading-relaxed whitespace-pre-line text-foreground">
          <InlineDescription text={doc.description} />
          {doc.defaultValue && (
            <div className="mt-1.5 text-muted-foreground">
              Default: <Code size={100}>{doc.defaultValue}</Code>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
