// Auto-generated from weeks-view.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "WeeksView",
  description:
    "A continuously scrolling window of week rows that spans month boundaries.",
  order: 22,
  section: "Components",
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
      <Tags.Paragraph>
        <code>WeeksView</code> renders a fixed-height{" "}
        <strong>window of week rows</strong> that scrolls continuously through
        the calendar — no page flips, no month boundaries. It's the layout
        behind agenda-style mini calendars (think Google Calendar's sidebar):
        June's last week and July's first week can sit next to each other in the
        same view.
      </Tags.Paragraph>
      <Tags.Paragraph>
        Compared to <a href="/docs/month-view">MonthView</a>:
      </Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th />
            <th>MonthView</th>
            <th>WeeksView</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit of display</td>
            <td>Whole months</td>
            <td>Any consecutive weeks</td>
          </tr>
          <tr>
            <td>Navigation</td>
            <td>Page by month</td>
            <td>Scroll by week row or page</td>
          </tr>
          <tr>
            <td>Window height</td>
            <td>
              Rows per month (or <code>fixedWeeks</code>)
            </td>
            <td>
              Always exactly <code>weekCount</code> rows
            </td>
          </tr>
          <tr>
            <td>Month labels</td>
            <td>One per grid</td>
            <td>
              <code>MonthSeparator</code> parts inside the flow
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        Both views share the same grid parts, selection model, and provider —
        switching between them is mostly a matter of swapping the root and
        navigation.
      </Tags.Paragraph>
      <Tags.ExampleBlock file="weeks-view-basic.tsx" />
      <Tags.Heading level={2} id="the-window">
        The window
      </Tags.Heading>
      <ul>
        <li>
          <strong>
            <code>weekCount</code>
          </strong>{" "}
          (required) — how many week rows are visible.
        </li>
        <li>
          <strong>
            <code>firstWeek</code> / <code>defaultFirstWeek</code> /{" "}
            <code>onFirstWeekChange</code>
          </strong>{" "}
          — the controlled / uncontrolled first visible week. Any date-like
          value works — a <code>FirstWeekSpec</code> is resolved to the
          containing week and snapped to <code>weekStartDay</code>:
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          '<WeeksView weekCount={5} defaultFirstWeek={{ month: 6, year: 2026 }} />\n// also accepted:\n//   Temporal.PlainDate.from("2026-06-15")\n//   new Date(2026, 5, 15)\n//   { isoWeek: 25, isoYear: 2026 }\n//   { week: 25, year: 2026 }   (relative to weekStartDay)\n'
        }
      </Tags.CodeBlock>
      <ul>
        <li>
          <strong>
            <code>onWindowChange</code>
          </strong>{" "}
          — fires with a <code>WindowInfo</code> snapshot whenever the window
          moves: <code>windowStart</code>/<code>windowEnd</code>, day and week
          counts, how many of those are enabled, and the{" "}
          <code>visibleMonths</code> list — handy for rendering a "Jun – Jul
          2026" heading (see the example above, which reads the same data from{" "}
          <code>useWeeksViewState().windowInfo</code>).
        </li>
      </ul>
      <Tags.Heading level={2} id="scrolling">
        Scrolling
      </Tags.Heading>
      <ul>
        <li>
          <strong>
            <code>PrevWeeksButton</code> / <code>NextWeeksButton</code>
          </strong>{" "}
          shift the window;{" "}
          <strong>
            <code>scrollBy</code>
          </strong>{" "}
          decides the step — <code>"row"</code> (one week, default) or{" "}
          <code>"page"</code> (a full <code>weekCount</code>).
        </li>
        <li>
          <strong>
            <code>WeekCount</code>
          </strong>{" "}
          renders the number of visible weeks, if you want it in your UI.
        </li>
        <li>
          Keyboard: arrowing or paging focus past the window edge scrolls it
          automatically.
        </li>
        <li>
          <strong>Imperative scrolling</strong> — <code>WeeksView</code> (and{" "}
          <code>WeeksView.Root</code>) forwards a ref with a{" "}
          <code>{"scrollToWeek(target, { snap })"}</code> handle:
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          'const ref = useRef<WeeksViewRootHandle>(null);\n\n<WeeksView ref={ref} temporal={Temporal} weekCount={6}>\n  {/* … */}\n</WeeksView>;\n\n// later:\nref.current?.scrollToWeek(Temporal.PlainDate.from("2026-09-01"), {\n  snap: "center",\n});\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        <code>snap</code> positions the target within the window:{" "}
        <code>"start"</code> (default), <code>"center"</code>,{" "}
        <code>"end"</code>, or <code>"nearest"</code> — which scrolls only if
        the target is outside the window, choosing the closer edge.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="behavior-at-the-bounds">
        Behavior at the bounds
      </Tags.Heading>
      <Tags.Paragraph>
        With <code>min</code>/<code>max</code> set,{" "}
        <code>outOfRangeBehavior</code> controls how the <em>window</em> treats
        the bounds (selection is always restricted regardless):
      </Tags.Paragraph>
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
              <code>"unbounded"</code> <em>(default)</em>
            </td>
            <td>Scroll freely; out-of-range days render disabled</td>
          </tr>
          <tr>
            <td>
              <code>"stop"</code>
            </td>
            <td>
              Nav buttons disable once the next step would show no in-range day
            </td>
          </tr>
          <tr>
            <td>
              <code>"stop-shrink"</code>
            </td>
            <td>
              Like <code>"stop"</code>, but the window shrinks near the edge
              instead of showing fully-disabled rows
            </td>
          </tr>
          <tr>
            <td>
              <code>"snap"</code>
            </td>
            <td>
              Overshooting jumps snap the window edge to the first/last in-range
              week
            </td>
          </tr>
          <tr>
            <td>
              <code>"snap-shrink"</code>
            </td>
            <td>Snap, then trim any remaining fully-disabled rows</td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        <code>"snap"</code> and <code>"snap-shrink"</code> only differ when the
        selectable range spans <em>fewer</em> weeks than <code>weekCount</code>:
        snapping can pin only one edge, so the window overhangs the other —{" "}
        <code>"snap"</code> keeps the full height (padding with disabled rows)
        while <code>"snap-shrink"</code> trims to just the in-range weeks. With{" "}
        <code>weekCount: 6</code> and bounds spanning 2 weeks,{" "}
        <code>"snap"</code> shows 6 rows (4 disabled),{" "}
        <code>"snap-shrink"</code> shows 2.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="month-separators">
        Month separators
      </Tags.Heading>
      <Tags.Paragraph>
        Because months flow into each other, <code>MonthSeparator</code> parts
        let you mark where a new month begins inside the grid — a border above
        its first week, a rotated month label in a side column, however you
        like. <code>MonthSeparatorRow</code> repeats for each month whose first
        day is in view and exposes layout state (<code>firstDayColumn</code>,{" "}
        <code>firstDayVisible</code>, <code>gridRowStart</code>,{" "}
        <code>fullWeeksVisibleAfter</code>) via its <code>render</code> prop,
        with <code>MonthSeparatorMonth</code> / <code>MonthSeparatorYear</code>{" "}
        for localized labels:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<GridBody>\n  <MonthSeparatorRow\n    render={(props, state) => (\n      <tr {...props} className="contents">\n        <td className="contents">\n          {state.firstDayVisible && (\n            <div\n              className="month-rule"\n              style={{\n                gridRow: state.gridRowStart,\n                gridColumn: `${state.firstDayColumn + 1} / -1`,\n              }}\n            >\n              <MonthSeparatorMonth format="short" />\n            </div>\n          )}\n        </td>\n      </tr>\n    )}\n  />\n  <WeekTemplate>{/* … */}</WeekTemplate>\n</GridBody>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Like the range overlays, separators assume a CSS-grid layout on{" "}
        <code>Grid</code> — see <a href="/docs/styling">Styling</a> and the{" "}
        <a href="/demo">demo</a> source for a complete implementation.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="week-numbers">
        Week numbers
      </Tags.Heading>
      <Tags.Paragraph>
        <code>WeekNumberHeader</code> / <code>WeekNumberCell</code> work exactly
        as in <a href="/docs/month-view#week-numbers">MonthView</a>.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="api-reference">
        API reference
      </Tags.Heading>
      <Tags.Heading level={3} id="props">
        Props
      </Tags.Heading>
      <Tags.Paragraph>
        <code>WeeksView</code> accepts all{" "}
        <a href="/docs/calendar-provider">CalendarProvider</a> props plus the
        view props below.
      </Tags.Paragraph>
      <Tags.ApiReference symbol="WeeksViewRootProps" />
      <Tags.Heading level={3} id="window-info">
        Window info
      </Tags.Heading>
      <Tags.ApiReference symbol="WindowInfo" />
      <Tags.Heading level={3} id="first-week-spec">
        First week spec
      </Tags.Heading>
      <Tags.ApiReference symbol="FirstWeekSpec" />
      <Tags.Heading level={3} id="hooks">
        Hooks
      </Tags.Heading>
      <Tags.Paragraph>
        Inside a <code>WeeksView</code>, <code>useWeeksViewStable()</code> and{" "}
        <code>useWeeksViewState()</code> expose the view's context — including{" "}
        <code>windowInfo</code> and the <code>scrollToWeek</code>/
        <code>goNext</code>/<code>goPrev</code> actions — for custom components.
      </Tags.Paragraph>
    </article>
  );
}
