// Auto-generated from month-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "MonthView",
  description:
    "The traditional paged month grid, with multi-month layouts and month-level navigation.",
  order: 21,
  section: "Components",
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
      <Tags.Paragraph>
        <code>MonthView</code> displays one or more month grids and pages
        between them — the classic date picker layout. It manages the visible
        month(s), keyboard focus, and navigation; selection state comes from its{" "}
        <a href="/docs/calendar-provider">CalendarProvider</a>.
      </Tags.Paragraph>
      <Tags.Paragraph>
        Use <code>MonthView</code> directly for the common case (it wraps a
        provider for you), or <code>CalendarProvider</code> +{" "}
        <code>MonthView.Root</code> when you compose the provider yourself:
      </Tags.Paragraph>
      <Tags.ExampleBlock file="basic-calendar.tsx" />
      <Tags.Heading level={2} id="navigation">
        Navigation
      </Tags.Heading>
      <ul>
        <li>
          <code>PrevMonthButton</code> / <code>NextMonthButton</code> page the
          view one month at a time and disable themselves at the bounds when{" "}
          <code>outOfRangeBehavior="stop"</code>.
        </li>
        <li>
          <code>MonthYearString</code> renders the localized current month label
          (and labels the grid for assistive tech).
        </li>
        <li>
          Keyboard: <code>PageUp</code>/<code>PageDown</code> page months,{" "}
          <code>Shift+PageUp</code>/<code>Shift+PageDown</code> page years, and
          arrowing past the grid edge moves the view automatically (
          <a href="/docs/accessibility">full list</a>).
        </li>
      </ul>
      <Tags.Heading level={3} id="controlled-month">
        Controlled month
      </Tags.Heading>
      <Tags.Paragraph>
        By default the view manages the visible month itself, starting at the
        selection or today (<code>defaultMonth</code> overrides the start). To
        control it — syncing with a URL, an agenda pane, or a "jump to date"
        input — pass <code>month</code> and update it in{" "}
        <code>onMonthChange</code>:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'const [month, setMonth] = useState(() =>\n  Temporal.PlainYearMonth.from("2026-06"),\n);\n\n<MonthView temporal={Temporal} month={month} onMonthChange={setMonth}>\n  {/* … */}\n</MonthView>;\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        <code>month</code> is an ISO <code>Temporal.PlainYearMonth</code> and
        round-trips with <code>onMonthChange</code> exactly;{" "}
        <code>onMonthChange</code> also fires for keyboard-driven month
        crossings, but never on mount.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="multiple-months">
        Multiple months
      </Tags.Heading>
      <Tags.Paragraph>
        Set <code>numberOfMonths</code> (1–12) and render one{" "}
        <code>{"Grid monthIndex={i}"}</code> per month. Navigation still moves
        by single months, revealing one new month per click:
      </Tags.Paragraph>
      <Tags.ExampleBlock file="multiple-months.tsx" />
      <Tags.Paragraph>
        Give each grid its own label with{" "}
        <code>{"MonthYearString monthIndex={i}"}</code>. Range selection spans
        grids naturally — a range can start in one month and end in another.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="grid-shape">
        Grid shape
      </Tags.Heading>
      <ul>
        <li>
          <strong>
            <code>fixedWeeks</code>
          </strong>{" "}
          — always render 6 week rows, padding with adjacent-month days.
          February 2026 (4 rows) and August 2026 (6 rows) take the same height,
          so nothing below the calendar jumps as users page.
        </li>
        <li>
          <strong>
            <code>outsideDays</code>
          </strong>{" "}
          — what to do with the adjacent-month days that pad the first and last
          weeks:
        </li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>"enabled"</code> <em>(default)</em>
            </td>
            <td>Fully interactive; clicking one selects it</td>
          </tr>
          <tr>
            <td>
              <code>"readOnly"</code>
            </td>
            <td>
              Visible but not selectable; range highlighting still paints
              through
            </td>
          </tr>
          <tr>
            <td>
              <code>"disabled"</code>
            </td>
            <td>Visible but not selectable; no range highlighting</td>
          </tr>
          <tr>
            <td>
              <code>"hidden"</code>
            </td>
            <td>
              Blank cells (kept in the DOM with <code>aria-hidden</code> for a
              stable grid shape)
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        Outside days carry <code>data-outside-month</code> (and{" "}
        <code>data-hidden</code> when hidden) for styling.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="bounds">
        Bounds
      </Tags.Heading>
      <Tags.Paragraph>
        <code>min</code>/<code>max</code> disable out-of-range days everywhere.{" "}
        <code>outOfRangeBehavior</code> additionally decides whether the user
        can still <em>page</em> past them:
      </Tags.Paragraph>
      <ul>
        <li>
          <code>"unbounded"</code> <em>(default)</em> — page freely;
          out-of-range days simply render disabled.
        </li>
        <li>
          <code>"stop"</code> — <code>PrevMonthButton</code>/
          <code>NextMonthButton</code> disable once the destination month
          crosses a bound.
        </li>
      </ul>
      <Tags.Heading level={2} id="week-numbers">
        Week numbers
      </Tags.Heading>
      <Tags.Paragraph>
        Add a <code>WeekNumberHeader</code> to the header row and a{" "}
        <code>WeekNumberCell</code> at the start of the week template to show
        ISO week numbers (determined by each row's Thursday, per ISO 8601):
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<GridHeader>\n  <WeekNumberHeader className="weeknum" />\n  <GridHeaderCell />\n</GridHeader>\n<GridBody>\n  <WeekTemplate>\n    <WeekNumberCell className="weeknum" />\n    <DayCellTemplate>\n      <DayButton />\n    </DayCellTemplate>\n  </WeekTemplate>\n</GridBody>\n'
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="api-reference">
        API reference
      </Tags.Heading>
      <Tags.Heading level={3} id="props">
        Props
      </Tags.Heading>
      <Tags.Paragraph>
        <code>MonthView</code> accepts all{" "}
        <a href="/docs/calendar-provider">CalendarProvider</a> props plus the
        view props below.
      </Tags.Paragraph>
      <Tags.ApiReference symbol="MonthViewRootProps" />
      <Tags.Heading level={3} id="hooks">
        Hooks
      </Tags.Heading>
      <Tags.Paragraph>
        Inside a <code>MonthView</code>, <code>useMonthViewStable()</code> and{" "}
        <code>useMonthViewState()</code> expose the view's context for custom
        components:
      </Tags.Paragraph>
      <Tags.ApiReference symbol="MonthViewStableContextValue" />
      <Tags.ApiReference symbol="MonthViewStateContextValue" />
    </article>
  );
}
