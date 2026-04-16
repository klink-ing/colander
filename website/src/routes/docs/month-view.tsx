// Auto-generated from month-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "MonthView",
  description:
    "Displays a traditional calendar grid with month-level navigation.",
  order: 3,
  section: "Components",
};

const apiSymbols = {
  MonthViewRootProps: {
    name: "MonthViewRootProps",
    kind: "interface",
    description: "Props accepted by `MonthView.Root`.",
    filePath: "package/src/month-view-types.ts",
    lineNumber: 10,
    properties: [
      {
        name: "numberOfMonths",
        type: "number",
        description: "Number of months to display simultaneously (1–12).",
        optional: true,
        defaultValue: "1",
      },
      {
        name: "fixedWeeks",
        type: "boolean",
        description:
          "When `true`, always render 6 week rows per month grid.\nPrevents layout shifts when navigating between months.",
        optional: true,
        defaultValue: "false",
      },
      {
        name: "outsideDays",
        type: "OutsideDays",
        description: "Controls how days from adjacent months are displayed.",
        optional: true,
        defaultValue: '"enabled"',
      },
      {
        name: "overflowBehavior",
        type: "MonthOverflowBehavior",
        description:
          'How month navigation behaves at `min`/`max` bounds.\n- `"unbounded"` — navigation is always allowed.\n- `"stop"` — navigation buttons disable at the boundary.',
        optional: true,
        defaultValue: '"unbounded"',
      },
      {
        name: "month",
        type: "PlainYearMonth",
        description:
          "The controlled visible month. When provided, the component is controlled.",
        optional: true,
      },
      {
        name: "defaultMonth",
        type: "PlainYearMonth",
        description: "The initial visible month (uncontrolled).",
        optional: true,
      },
      {
        name: "onMonthChange",
        type: "(month: PlainYearMonth) => void",
        description:
          "Called when the visible month changes via navigation or focus movement.\nNot called on initial mount.",
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
  MonthViewStableContextValue: {
    name: "MonthViewStableContextValue",
    kind: "interface",
    description:
      "Stable values (config + callbacks) provided by MonthView.Root.",
    filePath: "package/src/month-view-types.ts",
    lineNumber: 56,
    properties: [
      {
        name: "numberOfMonths",
        type: "number",
        description: "Number of simultaneously visible months.",
        optional: false,
      },
      {
        name: "fixedWeeks",
        type: "boolean",
        description: "Whether month grids always render 6 week rows.",
        optional: false,
      },
      {
        name: "outsideDays",
        type: "OutsideDays",
        description: "How outside-month days are displayed.",
        optional: false,
      },
      {
        name: "overflowBehavior",
        type: "MonthOverflowBehavior",
        description: "How month navigation behaves at bounds.",
        optional: false,
      },
      {
        name: "goNextMonth",
        type: "() => void",
        description: "Navigate to the next month(s).",
        optional: false,
      },
      {
        name: "goPrevMonth",
        type: "() => void",
        description: "Navigate to the previous month(s).",
        optional: false,
      },
      {
        name: "setGridLabelId",
        type: "(monthIndex: number, id: string | undefined) => void",
        description:
          "Register (or clear) the id of a label element for `aria-labelledby`, keyed by month index.",
        optional: false,
      },
      {
        name: "gridFocusedRef",
        type: "React.RefObject<boolean>",
        description:
          "Ref tracking whether the grid currently holds DOM focus (avoids state re-renders).",
        optional: false,
      },
    ],
  },
  MonthViewStateContextValue: {
    name: "MonthViewStateContextValue",
    kind: "interface",
    description: "Volatile state provided by MonthView.Root.",
    filePath: "package/src/month-view-types.ts",
    lineNumber: 76,
    properties: [
      {
        name: "currentMonth",
        type: "{ year: number; month: number; }",
        description: "The primary displayed month (year + month).",
        optional: false,
      },
      {
        name: "weeks",
        type: "PlainDate[][]",
        description: "2D array of weeks for the first visible month grid.",
        optional: false,
      },
      {
        name: "allMonths",
        type: "MonthData[]",
        description:
          "Pre-computed data for all visible months (length = `numberOfMonths`).",
        optional: false,
      },
      {
        name: "currentDateTime",
        type: "PlainDateTime",
        description:
          'Date-time representing the viewed month with time from the selection (for "today" highlighting).',
        optional: false,
      },
      {
        name: "gridLabelIds",
        type: "Record<number, string>",
        description:
          "Map of month index to label element id (for per-grid `aria-labelledby`).",
        optional: false,
      },
      {
        name: "rootState",
        type: "RootState",
        description: "The root component's state object for render functions.",
        optional: false,
      },
    ],
  },
};

export const Route = createFileRoute("/docs/month-view")({
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
      <Tags.ApiReference symbol={apiSymbols["MonthViewRootProps"]} />
      <Tags.Heading level={2} id="hooks">
        Hooks
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["MonthViewStableContextValue"]} />
      <Tags.ApiReference symbol={apiSymbols["MonthViewStateContextValue"]} />
    </article>
  );
}
