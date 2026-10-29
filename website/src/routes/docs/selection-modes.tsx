// Auto-generated from selection-modes.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Selection modes",
  description:
    "Single, multiple, and range selection — controlled and uncontrolled — plus range previews and drag handles.",
  order: 12,
  section: "Guides",
};

export const Route = createFileRoute("/docs/selection-modes")({
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
        Selection is configured on the{" "}
        <a href="/docs/calendar-provider">CalendarProvider</a> (or on the{" "}
        <code>MonthView</code> / <code>WeeksView</code> wrappers, which forward
        to it) with the <code>selectionMode</code> prop: <code>"single"</code>{" "}
        (default), <code>"multiple"</code>, or <code>"range"</code>. The mode
        determines the shape of <code>value</code>, <code>defaultValue</code>,
        and the argument to <code>onValueChange</code>.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="controlled-vs-uncontrolled">
        Controlled vs. uncontrolled
      </Tags.Heading>
      <Tags.Paragraph>
        Every mode supports both patterns, with the usual React rules:
      </Tags.Paragraph>
      <ul>
        <li>
          <strong>Uncontrolled</strong> — <em>omit</em> <code>value</code>{" "}
          entirely and optionally seed with <code>defaultValue</code>. The
          calendar manages its own state; <code>onValueChange</code> still
          reports every change.
        </li>
        <li>
          <strong>Controlled</strong> — pass <code>value</code> and keep it
          updated from <code>onValueChange</code>. Pass{" "}
          <code>{"value={null}"}</code> (or <code>[]</code> in multiple mode) to
          clear the selection — don't pass <code>{"value={undefined}"}</code>,
          which means "uncontrolled".
        </li>
      </ul>
      <Tags.Paragraph>
        <code>onValueChange(value, meta)</code> receives the new value in your
        configured <a href="/docs/dates-and-formats">format</a>, plus a{" "}
        <code>meta</code> object with the clicked <code>date</code> (a{" "}
        <code>Temporal.PlainDate</code>, or <code>undefined</code> for non-click
        changes) and the <code>previous</code> value.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="single">
        Single
      </Tags.Heading>
      <Tags.Paragraph>
        One date or <code>null</code>. Clicking the selected date again keeps it
        selected; clicking another date moves the selection.
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          "const [date, setDate] = useState<Temporal.PlainDate | null>(null);\n\n<MonthView temporal={Temporal} value={date} onValueChange={setDate}>\n  {/* … */}\n</MonthView>;\n"
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="multiple">
        Multiple
      </Tags.Heading>
      <Tags.Paragraph>
        An array of dates, kept sorted oldest-first. Clicking an unselected date
        adds it; clicking a selected date removes it.
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'const [dates, setDates] = useState<Temporal.PlainDate[]>([]);\n\n<MonthView\n  temporal={Temporal}\n  selectionMode="multiple"\n  value={dates}\n  onValueChange={setDates}\n>\n  {/* … */}\n</MonthView>;\n'
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="range">
        Range
      </Tags.Heading>
      <Tags.Paragraph>
        A <code>{"{ start, end }"}</code> pair (<code>DateRange</code>), either
        boundary possibly <code>null</code> while the range is in progress. The
        first click sets the start; hovering shows a live preview; the second
        click commits the end.
      </Tags.Paragraph>
      <Tags.ExampleBlock file="range-calendar.tsx" />
      <Tags.Paragraph>
        Style ranges with the <code>data-in-range</code> /{" "}
        <code>data-range-start</code> / <code>data-range-end</code> attributes
        on day cells, or with the <code>RangeSelected</code> overlay — both
        covered in <a href="/docs/styling">Styling</a>.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="clicking-inside-an-existing-range-">
        Clicking inside an existing range: <code>rangeMode</code>
      </Tags.Heading>
      <Tags.Paragraph>
        Once a full range exists, what should the next click do?{" "}
        <code>rangeMode</code> makes that policy explicit:
      </Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th>
              <code>rangeMode</code>
            </th>
            <th>Behavior on click</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>"nearest-end"</code> <em>(default)</em>
            </td>
            <td>
              Moves whichever boundary is closer to the clicked date; ties move
              the end
            </td>
          </tr>
          <tr>
            <td>
              <code>"nearest-start"</code>
            </td>
            <td>Same, but ties move the start</td>
          </tr>
          <tr>
            <td>
              <code>"adjust-end"</code>
            </td>
            <td>Always moves the end to the clicked date</td>
          </tr>
          <tr>
            <td>
              <code>"adjust-start"</code>
            </td>
            <td>Always moves the start to the clicked date</td>
          </tr>
          <tr>
            <td>
              <code>"start-end"</code>
            </td>
            <td>
              Two-step: the click starts a fresh range (click again to set its
              end)
            </td>
          </tr>
          <tr>
            <td>
              <code>"reset"</code>
            </td>
            <td>Collapses to a single-day range on the clicked date</td>
          </tr>
        </tbody>
      </table>
      <Tags.Heading level={3} id="reversed-selections">
        Reversed selections
      </Tags.Heading>
      <Tags.Paragraph>
        If the user picks an end date <em>before</em> the start date, the range
        is auto-sorted by default (select June 20 then June 10 → June 10–20).
        Set <code>preventRangeReversal</code> to instead collapse reversed picks
        to a single-day range — useful when "backwards" selection is likely a
        mistake in your UX.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="the-hover-preview">
        The hover preview
      </Tags.Heading>
      <Tags.Paragraph>
        While a range is in progress (and when hovering with{" "}
        <code>rangeMode</code> policies that would move a boundary), the
        provider computes a <strong>preview range</strong> — the range that{" "}
        <em>would</em> be committed if the user clicked the hovered day. It
        surfaces in three places:
      </Tags.Paragraph>
      <ul>
        <li>
          <code>data-range-preview-*</code> attributes on day cells,
        </li>
        <li>
          the <code>RangePreview</code> overlay component,
        </li>
        <li>
          <code>onHoveredDateChange</code>, if you want to react to hovering
          yourself.
        </li>
      </ul>
      <Tags.Paragraph>
        You can also take the preview over entirely with the{" "}
        <code>previewRange</code> prop — pass a <code>DateRange</code> to
        display, or <code>null</code> to hide it. This is how you'd preview a
        range from an external input (e.g. "next weekend" buttons above the
        calendar).
      </Tags.Paragraph>
      <Tags.Heading level={3} id="setting-a-range-programmatically">
        Setting a range programmatically
      </Tags.Heading>
      <Tags.Paragraph>
        Components inside the provider can commit a range directly with{" "}
        <code>setRange</code> from <code>useCalendarStable()</code>:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          "function NextWeekButton() {\n  const { setRange, temporal } = useCalendarStable();\n  return (\n    <button\n      onClick={() => {\n        const start = temporal.Now.plainDateISO().add({ days: 7 });\n        setRange(start, start.add({ days: 6 }));\n      }}\n    >\n      Next week\n    </button>\n  );\n}\n"
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        (For external control, the controlled <code>value</code> prop does the
        same job.)
      </Tags.Paragraph>
      <Tags.Heading level={3} id="drag-handles">
        Drag handles
      </Tags.Heading>
      <Tags.Paragraph>
        <code>RangeStartDragHandle</code> and <code>RangeEndDragHandle</code>{" "}
        render grab affordances inside day buttons at the range boundaries,
        letting users drag either end of a committed range. Place them inside{" "}
        <code>DayButton</code> (via children or <code>render</code>); they
        position themselves only on the boundary days and stay{" "}
        <code>aria-hidden</code> elsewhere:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<DayCellTemplate>\n  <DayButton\n    render={(props, state) => (\n      <button {...props}>\n        {state.date.day}\n        <RangeStartDragHandle className="handle" />\n        <RangeEndDragHandle className="handle" />\n      </button>\n    )}\n  />\n</DayCellTemplate>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Dragging is a pointer enhancement — every range edit remains possible by
        click and keyboard (see <a href="/docs/accessibility">Accessibility</a>
        ).
      </Tags.Paragraph>
      <Tags.Heading level={2} id="restricting-selectable-dates">
        Restricting selectable dates
      </Tags.Heading>
      <Tags.Paragraph>
        Three props combine to disable dates in every mode:
      </Tags.Paragraph>
      <ul>
        <li>
          <code>min</code> / <code>max</code> — bounds in your configured value
          format; days outside are disabled and keyboard focus is clamped to
          them.
        </li>
        <li>
          <code>isDateDisabled</code> — a predicate for irregular rules
          (weekends, blackout dates):
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView\n  temporal={Temporal}\n  min={Temporal.PlainDate.from("2026-06-01")}\n  max={Temporal.PlainDate.from("2026-12-31")}\n  isDateDisabled={(date) => date.dayOfWeek >= 6}\n>\n  {/* … */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <ul>
        <li>
          <code>disabled</code> / <code>readOnly</code> — disable the whole
          calendar, or allow browsing but not selecting.
        </li>
      </ul>
      <Tags.Paragraph>
        Note that <code>min</code>/<code>max</code> restrict <em>selection</em>;
        whether the user can still <em>navigate</em> past them is a per-view
        choice via <code>outOfRangeBehavior</code> — see{" "}
        <a href="/docs/month-view">MonthView</a> and{" "}
        <a href="/docs/weeks-view">WeeksView</a>.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="switching-modes-at-runtime">
        Switching modes at runtime
      </Tags.Heading>
      <Tags.Paragraph>
        If <code>selectionMode</code> changes while the calendar is mounted
        (e.g. a "range" toggle in your UI), an uncontrolled calendar truncates
        its state sensibly (range → its start date, etc.) and reports the change
        through <code>onValueChange</code>. A controlled calendar leaves
        reconciling <code>value</code> to you.
      </Tags.Paragraph>
    </article>
  );
}
