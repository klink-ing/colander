// Auto-generated from calendar-provider.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "CalendarProvider",
  description:
    "Manages shared state across calendar views — selection, bounds, locale, and more.",
  order: 2,
  section: "Components",
};

const apiSymbols = {
  CalendarProviderProps: {
    name: "CalendarProviderProps",
    kind: "interface",
    description: "Props accepted by `CalendarProvider`.",
    filePath: "package/src/calendar-types.ts",
    lineNumber: 153,
    typeText: "CalendarProviderProps<F>",
    properties: [
      {
        name: "format",
        type: "F",
        description:
          "The value format used for date serialization. Determines the type of\n`value`, `defaultValue`, `min`, `max`, and callback parameters.",
        optional: true,
        defaultValue: '"PlainDate"',
      },
      {
        name: "min",
        type: "RawValueForFormat<F>",
        description:
          "Earliest selectable date. Dates before this are disabled.",
        optional: true,
      },
      {
        name: "max",
        type: "RawValueForFormat<F>",
        description: "Latest selectable date. Dates after this are disabled.",
        optional: true,
      },
      {
        name: "disabled",
        type: "boolean",
        description: "When `true`, the entire calendar is disabled.",
        optional: true,
        defaultValue: "false",
      },
      {
        name: "readOnly",
        type: "boolean",
        description:
          "When `true`, the calendar is read-only. Keyboard navigation still works\nbut selection is prevented.",
        optional: true,
        defaultValue: "false",
      },
      {
        name: "isDateDisabled",
        type: "(date: PlainDate) => boolean",
        description:
          "Callback to disable individual dates. Return `true` to disable a date.\nCalled in addition to `min`/`max` bounds checking.",
        optional: true,
      },
      {
        name: "timeZone",
        type: "string",
        description:
          "IANA time zone identifier used for date/time conversions.",
        optional: true,
        defaultValue: "The system's current time zone.",
      },
      {
        name: "locale",
        type: "string",
        description:
          "BCP 47 locale string used for formatting month names, weekday labels,\nand other locale-sensitive output.",
        optional: true,
        defaultValue: '"en-US"',
      },
      {
        name: "temporal",
        type: "TemporalNamespace",
        description:
          "Custom Temporal namespace for environments without native Temporal support.",
        optional: true,
      },
      {
        name: "weekStartDay",
        type: "WeekStartDay",
        description:
          "Day of the week the calendar grid starts on.\n`0` = Sunday, `1` = Monday, ..., `6` = Saturday.",
        optional: true,
        defaultValue: "0",
      },
      {
        name: "children",
        type: "React.ReactNode",
        description: "React children.",
        optional: true,
      },
      {
        name: "selectionMode",
        type: '"single" | "range" | "multiple"',
        description: "",
        optional: true,
        defaultValue: '"single"',
      },
      {
        name: "value",
        type: "RawValueForFormat<F> | DateRange<F> | RawValueForFormat<F>[] | null",
        description: "The controlled selected date. Pass `null` to clear.",
        optional: true,
      },
      {
        name: "defaultValue",
        type: "RawValueForFormat<F> | DateRange<F> | RawValueForFormat<F>[]",
        description: "",
        optional: true,
      },
      {
        name: "onValueChange",
        type: "((value: RawValueForFormat<F> | null, meta: ValueChangeMeta<RawValueForFormat<F> | null>) => void) | ((value: RawValueForFormat<F> | null, meta: ValueChangeMeta<RawValueForFormat<F> | null>) => void) | ((value: DateRange<F> | null, meta: ValueChangeMeta<DateRange<F> | null>) => void) | ((value: DateRange<F> | null, meta: ValueChangeMeta<DateRange<F> | null>) => void) | ((value: RawValueForFormat<F>[], meta: ValueChangeMeta<RawValueForFormat<F>[]>) => void) | ((value: RawValueForFormat<F>[], meta: ValueChangeMeta<RawValueForFormat<F>[]>) => void)",
        description: "",
        optional: true,
      },
    ],
  },
  CalendarStableContextValue: {
    name: "CalendarStableContextValue",
    kind: "interface",
    description:
      "Stable values (callbacks, config) provided by CalendarProvider — shared across all views.",
    filePath: "package/src/calendar-types.ts",
    lineNumber: 169,
    properties: [
      {
        name: "onSelect",
        type: "(date: PlainDate) => void",
        description:
          "Selects (or toggles) a date, respecting the current selection mode.",
        optional: false,
      },
      {
        name: "setRange",
        type: "(start: PlainDate, end: PlainDate) => void",
        description:
          "Programmatically sets the range boundaries (normalized so start <= end).",
        optional: false,
      },
      {
        name: "selectionMode",
        type: '"single" | "range" | "multiple"',
        description: "The active selection mode.",
        optional: false,
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Whether the entire calendar is disabled.",
        optional: false,
      },
      {
        name: "readOnly",
        type: "boolean",
        description: "Whether the calendar is read-only.",
        optional: false,
      },
      {
        name: "isDateDisabled",
        type: "(date: PlainDate) => boolean",
        description: "User-supplied predicate for individually disabled dates.",
        optional: true,
      },
      {
        name: "minValue",
        type: "PlainDate",
        description: "Earliest selectable date (resolved from the `min` prop).",
        optional: true,
      },
      {
        name: "maxValue",
        type: "PlainDate",
        description: "Latest selectable date (resolved from the `max` prop).",
        optional: true,
      },
      {
        name: "timeZone",
        type: "string",
        description: "Resolved IANA time zone.",
        optional: false,
      },
      {
        name: "locale",
        type: "string",
        description: "Resolved BCP 47 locale.",
        optional: false,
      },
      {
        name: "temporal",
        type: "TemporalNamespace",
        description: "Resolved Temporal namespace.",
        optional: false,
      },
      {
        name: "weekStartDay",
        type: "WeekStartDay",
        description: "Day the calendar week starts on.",
        optional: false,
      },
      {
        name: "rangeMode",
        type: "RangeMode",
        description: "Active range selection mode.",
        optional: false,
      },
      {
        name: "preventRangeReversal",
        type: "boolean",
        description:
          "Whether reversed ranges are auto-sorted instead of collapsed.",
        optional: false,
      },
      {
        name: "valueFormat",
        type: '"object" | "PlainDate" | "PlainDateTime" | "PlainMonthDay" | "PlainTime" | "PlainYearMonth" | "ZonedDateTime" | "Date"',
        description: "The value format discriminant.",
        optional: false,
      },
      {
        name: "setHoveredDate",
        type: "(date: PlainDate | undefined) => void",
        description: "Sets the hovered date for range preview.",
        optional: false,
      },
    ],
  },
  CalendarStateContextValue: {
    name: "CalendarStateContextValue",
    kind: "interface",
    description:
      "Volatile state provided by CalendarProvider — shared across all views.",
    filePath: "package/src/calendar-types.ts",
    lineNumber: 205,
    properties: [
      {
        name: "selected",
        type: "DateValueObject | undefined",
        description:
          "The currently selected value as a tagged {@link DateValueObject}.",
        optional: false,
      },
      {
        name: "selectedDates",
        type: "PlainDate[]",
        description: "Flat array of all selected dates (plain dates, sorted).",
        optional: false,
      },
      {
        name: "rangeStart",
        type: "PlainDate | undefined",
        description: "Start of the current range selection, or `undefined`.",
        optional: false,
      },
      {
        name: "rangeEnd",
        type: "PlainDate | undefined",
        description: "End of the current range selection, or `undefined`.",
        optional: false,
      },
      {
        name: "hoveredDate",
        type: "PlainDate | undefined",
        description: "The currently hovered date (for range preview).",
        optional: false,
      },
      {
        name: "previewStart",
        type: "PlainDate | undefined",
        description: "Start of the computed preview range.",
        optional: false,
      },
      {
        name: "previewEnd",
        type: "PlainDate | undefined",
        description: "End of the computed preview range.",
        optional: false,
      },
    ],
  },
};

export const Route = createFileRoute("/docs/calendar-provider")({
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
      <Tags.ApiReference symbol={apiSymbols["CalendarProviderProps"]} />
      <Tags.Heading level={2} id="stable-context">
        Stable Context
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["CalendarStableContextValue"]} />
      <Tags.Heading level={2} id="state-context">
        State Context
      </Tags.Heading>
      <Tags.ApiReference symbol={apiSymbols["CalendarStateContextValue"]} />
    </article>
  );
}
