// Auto-generated from composition.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Composition",
  description:
    "How Colander components fit together — templates, the render prop, and building your own parts.",
  order: 10,
  section: "Guides",
};

export const Route = createFileRoute("/docs/composition")({
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
        Colander is a set of compound components: small parts that you arrange
        in JSX to form a calendar. This page explains the component tree, the{" "}
        <em>template</em> components that repeat themselves, the{" "}
        <code>render</code> prop, and how to drop down to hooks when you need a
        part the library doesn't ship.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="the-component-tree">
        The component tree
      </Tags.Heading>
      <Tags.CodeBlock data-language="text">
        {
          'CalendarProvider                 selection state, bounds, locale, time zone\n└─ MonthView.Root │ WeeksView.Root    view state: visible month(s) / week window, focus\n   ├─ PrevMonthButton / NextMonthButton    (or PrevWeeksButton / NextWeeksButton)\n   ├─ MonthYearString                      localized label, labels the grid\n   └─ Grid                                 <table role="grid">\n      ├─ GridHeader                        <thead>\n      │  └─ GridHeaderCell                 <th> weekday labels (×7)\n      └─ GridBody                          <tbody>\n         └─ WeekTemplate                   <tr> — repeated per visible week\n            ├─ WeekNumberCell              optional <td> week number\n            ├─ RangeSelected               optional range overlay <td>\n            ├─ RangePreview                optional hover-preview overlay <td>\n            └─ DayCellTemplate             <td role="gridcell"> — repeated per day\n               └─ DayButton                <button> — the interactive day\n                  ├─ RangeStartDragHandle  optional\n                  └─ RangeEndDragHandle    optional\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>Two rules make the tree work:</Tags.Paragraph>
      <ol>
        <li>
          <strong>State flows down through context.</strong>{" "}
          <code>CalendarProvider</code> owns the selection; the view root owns
          navigation and focus; grid parts read both. No prop drilling.
        </li>
        <li>
          <strong>You write structure once; templates repeat it.</strong>
        </li>
      </ol>
      <Tags.Heading level={2} id="templates">
        Templates
      </Tags.Heading>
      <Tags.Paragraph>
        <code>WeekTemplate</code>, <code>DayCellTemplate</code>, and{" "}
        <code>GridHeaderCell</code> are <em>templates</em>: the single element
        you write is instantiated for every week, day, and weekday in view. This
        keeps a full calendar's JSX to a dozen lines while letting you customize
        the one repeated unit:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<GridBody>\n  <WeekTemplate>\n    <DayCellTemplate>\n      <DayButton className="day" />\n    </DayCellTemplate>\n  </WeekTemplate>\n</GridBody>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Each instance receives its own state — <code>DayCellTemplate</code> and{" "}
        <code>DayButton</code> know their <code>date</code>,{" "}
        <code>columnIndex</code>, and every selection flag for that specific
        day. You can also opt out of iteration:{" "}
        <code>{"DayCellTemplate date={someDate}"}</code> renders a single
        explicit cell, and <code>{"GridHeaderCell index={0}"}</code> renders
        just one weekday header.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="convenience-wrappers-vs-explicit-provider">
        Convenience wrappers vs. explicit provider
      </Tags.Heading>
      <Tags.Paragraph>
        <code>MonthView</code> and <code>WeeksView</code> fold a{" "}
        <code>CalendarProvider</code> and the corresponding <code>.Root</code>{" "}
        into one component — ideal for the common case:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView temporal={Temporal} selectionMode="range">\n  {/* navigation + grid */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Use the explicit form when you need to place the provider yourself — for
        example, to share one selection between two views, or to read calendar
        state from components that live outside the view:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<CalendarProvider temporal={Temporal} selectionMode="range">\n  <MonthView.Root numberOfMonths={2}>{/* grids */}</MonthView.Root>\n  <SelectionSummary /> {/* reads state via hooks, outside the view */}\n</CalendarProvider>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Both forms accept the same props; the wrapper simply forwards view props
        to <code>.Root</code> and everything else to the provider.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="the-render-prop">
        The render prop
      </Tags.Heading>
      <Tags.Paragraph>
        Every component accepts a <code>render</code> prop (the same pattern as{" "}
        <a href="https://base-ui.com/react/handbook/composition">Base UI</a>)
        for when <code>className</code> and CSS aren't enough. Pass a function
        that receives the merged DOM props and a typed <code>state</code>{" "}
        object, and return the element you want:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          "<WeekTemplate\n  render={(props, state) => (\n    <tr\n      {...props}\n      style={state.gridRowIndex ? { gridRow: state.gridRowIndex } : undefined}\n    />\n  )}\n/>\n"
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>Rules of thumb:</Tags.Paragraph>
      <ul>
        <li>
          <strong>
            Always spread <code>props</code>
          </strong>{" "}
          onto your element — they carry the event handlers, ARIA attributes,
          and <code>data-*</code> state the library manages.
        </li>
        <li>
          <strong>
            <code>state</code> is read-only and fully typed
          </strong>{" "}
          per component (<code>DayButtonState</code>,{" "}
          <code>WeekTemplateState</code>, <code>RangeSelectedState</code>, …).
          Every state also includes <code>state.root</code> (a{" "}
          <code>RootState</code>) with calendar-wide values:{" "}
          <code>selected</code>, <code>rangeStart</code>/<code>rangeEnd</code>,{" "}
          <code>viewing</code>, <code>focused</code>, <code>locale</code>,{" "}
          <code>timeZone</code>, and more.
        </li>
        <li>
          Keep the element type semantically equivalent (a <code>{"<td>"}</code>{" "}
          for cell parts, a <code>{"<button>"}</code> for interactive parts) so
          the grid semantics survive.
        </li>
      </ul>
      <Tags.Heading level={2} id="building-your-own-parts">
        Building your own parts
      </Tags.Heading>
      <Tags.Paragraph>
        When the shipped parts aren't enough, use the same hooks and contexts
        they're built from:
      </Tags.Paragraph>
      <ul>
        <li>
          <code>useCalendarStable()</code> — stable config and actions:{" "}
          <code>onSelect(date)</code>, <code>setRange(start, end)</code>,{" "}
          <code>selectionMode</code>, <code>minValue</code>/
          <code>maxValue</code>, <code>temporal</code>, <code>locale</code>,{" "}
          <code>timeZone</code>, <code>weekStartDay</code>.
        </li>
        <li>
          <code>useCalendarState()</code> — live selection state:{" "}
          <code>selected</code>, <code>selectedDates</code>,{" "}
          <code>rangeStart</code>/<code>rangeEnd</code>,{" "}
          <code>hoveredDate</code>, <code>previewStart</code>/
          <code>previewEnd</code>.
        </li>
        <li>
          <code>useMonthViewState()</code> / <code>useWeeksViewState()</code> —
          view state: the visible month data (<code>allMonths</code>) or the
          weeks window (<code>windowInfo</code>).
        </li>
        <li>
          <code>DayCellDataContext</code> / <code>GridContext</code> — inside a
          cell, the cell's <code>date</code> and the grid's{" "}
          <code>orientation</code>.
        </li>
      </ul>
      <Tags.Paragraph>
        For example, a footer that shows the current selection:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'function SelectionSummary() {\n  const { locale } = useCalendarStable();\n  const { rangeStart, rangeEnd } = useCalendarState();\n  if (!rangeStart) return <p>Select a start date</p>;\n  return (\n    <p>\n      {rangeStart.toLocaleString(locale)}\n      {rangeEnd ? ` – ${rangeEnd.toLocaleString(locale)}` : " – …"}\n    </p>\n  );\n}\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Any component using these hooks must be rendered inside the provider
        (and inside the view root for the view hooks).
      </Tags.Paragraph>
      <Tags.Heading level={2} id="multiple-months">
        Multiple months
      </Tags.Heading>
      <Tags.Paragraph>
        One <code>MonthView.Root</code> can display several consecutive months.
        Set <code>numberOfMonths</code>, then render one <code>Grid</code> per
        month with <code>monthIndex</code>:
      </Tags.Paragraph>
      <Tags.ExampleBlock file="multiple-months.tsx" />
      <Tags.Paragraph>
        <code>{"MonthYearString monthIndex={i}"}</code> labels each grid;
        navigation buttons page the whole window. See{" "}
        <a href="/docs/month-view">MonthView</a> for details.
      </Tags.Paragraph>
    </article>
  );
}
