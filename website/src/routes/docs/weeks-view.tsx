// Auto-generated from weeks-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "WeeksView",
  description:
    "Displays a configurable window of continuous week rows that span month boundaries.",
  order: 4,
  section: "Components",
};

const apiSymbols = {
  WeeksViewRootProps: {
    name: "WeeksViewRootProps",
    kind: "interface",
    description: "Props accepted by `WeeksView.Root`.",
    filePath: "package/src/weeks-view-types.ts",
    lineNumber: 11,
    properties: [
      {
        name: "weekCount",
        type: "number",
        description: "Number of week rows to display simultaneously.",
        optional: false,
      },
      {
        name: "firstWeek",
        type: "FirstWeekSpec",
        description:
          "The controlled first visible week. When provided, the component is controlled.",
        optional: true,
      },
      {
        name: "defaultFirstWeek",
        type: "FirstWeekSpec",
        description: "The initial first visible week (uncontrolled).",
        optional: true,
      },
      {
        name: "onFirstWeekChange",
        type: "(date: PlainDate) => void",
        description:
          "Called when the first visible week changes via navigation or focus movement.",
        optional: true,
      },
      {
        name: "scrollBy",
        type: '"row" | "page"',
        description:
          'How much to scroll per navigation step.\n- `"row"` — scroll one week row at a time.\n- `"page"` — scroll a full page (all visible rows) at a time.',
        optional: true,
        defaultValue: '"row"',
      },
      {
        name: "overflowBehavior",
        type: "OverflowBehavior",
        description: "How navigation behaves at `min`/`max` bounds.",
        optional: true,
        defaultValue: '"unbounded"',
      },
      {
        name: "onWindowChange",
        type: "(info: WindowInfo) => void",
        description: "Called when the visible window changes.",
        optional: true,
      },
      {
        name: "children",
        type: "React.ReactNode",
        description: "React children.",
        optional: true,
      },
    ],
  },
  WindowInfo: {
    name: "WindowInfo",
    kind: "interface",
    description: "Describes the currently visible window of weeks.",
    filePath: "package/src/weeks-view-types.ts",
    lineNumber: 49,
    properties: [
      {
        name: "windowStart",
        type: "PlainDate",
        description: "The first date of the visible window.",
        optional: false,
      },
      {
        name: "windowEnd",
        type: "PlainDate",
        description: "The last date of the visible window.",
        optional: false,
      },
      {
        name: "weekCount",
        type: "number",
        description:
          "Number of week rows in the window (the prop value, not actual when shrunk).",
        optional: false,
      },
      {
        name: "dayCount",
        type: "number",
        description: "Total number of calendar days in the window.",
        optional: false,
      },
      {
        name: "enabledWeekCount",
        type: "number",
        description: "Number of weeks that contain at least one enabled date.",
        optional: false,
      },
      {
        name: "enabledDayCount",
        type: "number",
        description: "Number of enabled (selectable) dates in the window.",
        optional: false,
      },
      {
        name: "visibleMonths",
        type: "VisibleMonth[]",
        description:
          "Distinct months visible in the window, in chronological order.",
        optional: false,
      },
    ],
  },
  FirstWeekSpec: {
    name: "FirstWeekSpec",
    kind: "interface",
    description:
      "A flexible specifier for a calendar week. Accepts a `Temporal.PlainDate`,\na native `Date`, an ISO week number, a week-of-year, or a month/day pair.",
    filePath: "package/src/resolve-first-week.ts",
    lineNumber: 8,
    typeText: "FirstWeekSpec",
    properties: [
      {
        name: "toLocaleString",
        type: "(() => string) | ((locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined) => string) | { (): string; (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string; (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string; }",
        description: "",
        optional: false,
      },
      {
        name: "toString",
        type: "((options?: Temporal.ShowCalendarOption | undefined) => string) | (() => string) | (() => string)",
        description: "",
        optional: false,
      },
      {
        name: "valueOf",
        type: "(() => never) | (() => number) | (() => Object)",
        description: "",
        optional: false,
      },
    ],
    members: [
      "PlainDate",
      "Date",
      "{ isoWeek: number; isoYear: number; }",
      "{ week: number; year: number; }",
      "{ month: number; year: number; day?: number; }",
    ],
  },
};

export const Route = createFileRoute("/docs/weeks-view")({
  loader: () => ({ frontmatter }),
  head: () => ({
    meta: [
      { title: `${frontmatter.title} - ${PROJECT_NAME}` },
      ...(frontmatter.description
        ? [{ name: "description", content: frontmatter.description }]
        : []),
    ],
  }),
  component: DocContent,
});

function DocContent() {
  return (
    <article>
      <Tags.Heading level={2} id="props">
        Props
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["WeeksViewRootProps"]} />
      <Tags.Heading level={2} id="window-info">
        Window Info
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["WindowInfo"]} />
      <Tags.Heading level={2} id="first-week-spec">
        First Week Spec
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["FirstWeekSpec"]} />
    </article>
  );
}
