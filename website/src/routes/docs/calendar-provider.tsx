// Auto-generated from calendar-provider.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "CalendarProvider",
  description:
    "Manages shared state across calendar views — selection, bounds, locale, and more.",
  order: 20,
  section: "Components",
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
      <Tags.Paragraph>
        <code>CalendarProvider</code> is the state root of every calendar. It
        owns the selection (in all{" "}
        <a href="/docs/selection-modes">three modes</a>), resolves configuration
        — bounds, time zone, locale, week start, the{" "}
        <a href="/docs/dates-and-formats">Temporal implementation</a> — and
        shares everything with its descendants through context. It renders no
        DOM of its own.
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'import { Temporal } from "@js-temporal/polyfill";\nimport { CalendarProvider, MonthView } from "@klinking/colander";\n\n<CalendarProvider\n  temporal={Temporal}\n  selectionMode="range"\n  weekStartDay={1}\n  onValueChange={(range) => console.log(range)}\n>\n  <MonthView.Root>{/* navigation + grid */}</MonthView.Root>\n</CalendarProvider>;\n'
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="when-you-need-it-explicitly">
        When you need it explicitly
      </Tags.Heading>
      <Tags.Paragraph>
        The <code>MonthView</code> and <code>WeeksView</code> wrappers already
        include a <code>CalendarProvider</code>, so most calendars never mention
        it. Reach for the explicit form when:
      </Tags.Paragraph>
      <ul>
        <li>
          <strong>Components outside the view need calendar state.</strong>{" "}
          Anything using <code>useCalendarStable()</code> /{" "}
          <code>useCalendarState()</code> must live under the provider — a
          selection summary, preset-range buttons, a clear button.
        </li>
        <li>
          <strong>Two views should share one selection.</strong> Render both
          roots under a single provider — for example a month grid next to a
          scrolling weeks strip, always in sync:
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          '<CalendarProvider temporal={Temporal} selectionMode="range">\n  <MonthView.Root>{/* … */}</MonthView.Root>\n  <WeeksView.Root weekCount={3}>{/* … */}</WeeksView.Root>\n</CalendarProvider>\n'
        }
      </Tags.CodeBlock>
      <ul>
        <li>
          <strong>You're building a custom view</strong> from the grid
          primitives and hooks.
        </li>
      </ul>
      <Tags.Callout type="warning">
        <Tags.Paragraph>
          Don't nest a <code>MonthView</code>/<code>WeeksView</code>{" "}
          <em>wrapper</em> inside a <code>CalendarProvider</code> — the wrapper
          creates its own provider, which would shadow yours. Inside an explicit
          provider, always use <code>MonthView.Root</code> /{" "}
          <code>WeeksView.Root</code>.
        </Tags.Paragraph>
      </Tags.Callout>
      <Tags.Heading level={2} id="what-it-manages">
        What it manages
      </Tags.Heading>
      <ul>
        <li>
          <strong>Selection</strong> — single / range / multiple, controlled or
          uncontrolled, exposed in your configured value{" "}
          <a href="/docs/dates-and-formats">format</a>.
        </li>
        <li>
          <strong>Constraints</strong> — <code>min</code>, <code>max</code>,{" "}
          <code>isDateDisabled</code>, <code>disabled</code>,{" "}
          <code>readOnly</code>.
        </li>
        <li>
          <strong>Range behavior</strong> — <code>rangeMode</code>,{" "}
          <code>preventRangeReversal</code>, the hover preview and{" "}
          <code>previewRange</code> override.
        </li>
        <li>
          <strong>Environment</strong> — <code>temporal</code>,{" "}
          <code>timeZone</code>, <code>locale</code>, <code>weekStartDay</code>.
        </li>
      </ul>
      <Tags.Paragraph>
        What it does <em>not</em> manage: focus, keyboard navigation, and which
        month/weeks are visible — those belong to the view roots (
        <a href="/docs/month-view">MonthView</a>,{" "}
        <a href="/docs/weeks-view">WeeksView</a>), which is why the provider
        alone renders nothing interactive.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="reading-state-with-hooks">
        Reading state with hooks
      </Tags.Heading>
      <Tags.Paragraph>
        Two hooks expose the provider's context, split by volatility so
        components can subscribe to only what they need:
      </Tags.Paragraph>
      <ul>
        <li>
          <code>useCalendarStable()</code> — configuration and stable callbacks
          (<code>onSelect</code>, <code>setRange</code>,{" "}
          <code>selectionMode</code>, <code>minValue</code>,{" "}
          <code>maxValue</code>, <code>temporal</code>, <code>locale</code>,{" "}
          <code>timeZone</code>, …). Doesn't change during normal interaction.
        </li>
        <li>
          <code>useCalendarState()</code> — the live values (
          <code>selected</code>, <code>selectedDates</code>,{" "}
          <code>rangeStart</code>, <code>rangeEnd</code>,{" "}
          <code>hoveredDate</code>, <code>previewStart</code>,{" "}
          <code>previewEnd</code>).
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          "function ClearButton() {\n  const { setRange, readOnly } = useCalendarStable();\n  const { rangeStart, rangeEnd } = useCalendarState();\n  if (!rangeStart || readOnly) return null;\n  // …\n}\n"
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="api-reference">
        API reference
      </Tags.Heading>
      <Tags.Heading level={3} id="props">
        Props
      </Tags.Heading>
      <Tags.ApiReference symbol="CalendarProviderProps" />
      <Tags.Heading level={3} id="stable-context">
        Stable context
      </Tags.Heading>
      <Tags.ApiReference symbol="CalendarStableContextValue" />
      <Tags.Heading level={3} id="state-context">
        State context
      </Tags.Heading>
      <Tags.ApiReference symbol="CalendarStateContextValue" />
    </article>
  );
}
