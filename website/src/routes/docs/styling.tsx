// Auto-generated from styling.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Styling",
  description:
    "Style Colander with plain CSS, Tailwind, or any tool — via data attributes and the render prop.",
  order: 11,
  section: "Guides",
};

export const Route = createFileRoute("/docs/styling")({
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
        Colander ships zero CSS. Every component renders a semantic element you
        style yourself, and exposes its interaction state on the DOM so your
        styles can react to it. There are three layers, from simplest to most
        powerful:
      </Tags.Paragraph>
      <ol>
        <li>
          <strong>
            <code>className</code>
          </strong>{" "}
          — every part accepts one.
        </li>
        <li>
          <strong>
            <code>data-*</code> attributes
          </strong>{" "}
          — state stamped onto the element; target it with CSS attribute
          selectors.
        </li>
        <li>
          <strong>
            The <code>render</code> prop
          </strong>{" "}
          — replace the element and read the typed <code>state</code> object
          directly (see <a href="/docs/composition">Composition</a>).
        </li>
      </ol>
      <Tags.Heading level={2} id="styling-with-data-attributes">
        Styling with data attributes
      </Tags.Heading>
      <Tags.Paragraph>
        State becomes presence-style attributes: <code>data-selected</code> is
        present when a day is selected and absent otherwise. In CSS:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="css">
        {
          ".day[data-selected] {\n  background: black;\n  color: white;\n}\n\n.day[data-today] {\n  font-weight: 700;\n}\n\n.day[data-outside-month] {\n  opacity: 0.45;\n}\n\n.day[data-disabled] {\n  opacity: 0.35;\n  pointer-events: none;\n}\n"
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        With Tailwind, use the <code>data-*</code> variants directly on{" "}
        <code>className</code>:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<DayButton\n  className="size-9 rounded-md hover:bg-neutral-100\n    data-today:font-bold\n    data-outside-month:text-neutral-400\n    data-selected:bg-neutral-900 data-selected:text-white\n    data-in-range:bg-neutral-200\n    data-disabled:pointer-events-none data-disabled:opacity-40\n    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"\n/>\n'
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="data-attribute-reference">
        Data attribute reference
      </Tags.Heading>
      <Tags.Heading level={3} id="-and-">
        <code>DayCellTemplate</code> and <code>DayButton</code>
      </Tags.Heading>
      <table>
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Present when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>data-date="2026-06-20"</code>
            </td>
            <td>Always — the cell's ISO date (a value, not a flag)</td>
          </tr>
          <tr>
            <td>
              <code>data-selected</code>
            </td>
            <td>The day is selected</td>
          </tr>
          <tr>
            <td>
              <code>data-today</code>
            </td>
            <td>
              The day is today (in the calendar's <code>timeZone</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>data-disabled</code>
            </td>
            <td>
              Disabled via <code>min</code>/<code>max</code>,{" "}
              <code>isDateDisabled</code>, or <code>disabled</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>data-focused</code>
            </td>
            <td>The day is the grid's logically focused cell</td>
          </tr>
          <tr>
            <td>
              <code>data-outside-month</code>
            </td>
            <td>The day belongs to an adjacent month</td>
          </tr>
          <tr>
            <td>
              <code>data-hidden</code>
            </td>
            <td>
              The cell is blanked by <code>outsideDays="hidden"</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>data-orientation</code>
            </td>
            <td>
              <code>"horizontal"</code> or <code>"vertical"</code> (a value)
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>Range selection adds:</Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Present when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>data-in-range</code>
            </td>
            <td>The day is inside the committed range</td>
          </tr>
          <tr>
            <td>
              <code>data-range-start</code> / <code>data-range-end</code>
            </td>
            <td>The day is the range's first / last day</td>
          </tr>
          <tr>
            <td>
              <code>data-range-boundary</code>
            </td>
            <td>Either of the above</td>
          </tr>
          <tr>
            <td>
              <code>data-range-index</code> / <code>data-range-length</code>
            </td>
            <td>Position within / size of the range (values)</td>
          </tr>
          <tr>
            <td>
              <code>data-range-has-start</code> /{" "}
              <code>data-range-has-end</code>
            </td>
            <td>The range's boundary is defined</td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        The hover <strong>preview</strong> range (see{" "}
        <a href="/docs/selection-modes">Selection modes</a>) mirrors the same
        set with a <code>data-range-preview-*</code> prefix:{" "}
        <code>data-range-preview-in-range</code>,{" "}
        <code>data-range-preview-start</code>,{" "}
        <code>data-range-preview-end</code>,{" "}
        <code>data-range-preview-boundary</code>, and so on — so you can render
        "what would happen if you clicked here" more subtly than the committed
        range.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="other-parts">
        Other parts
      </Tags.Heading>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Attributes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>Grid</code>
            </td>
            <td>
              <code>data-orientation</code>, <code>data-days-per-week</code>,{" "}
              <code>data-weeks-in-month</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>PrevMonthButton</code> / <code>NextMonthButton</code>
            </td>
            <td>
              <code>data-direction="prev" / "next"</code>, native{" "}
              <code>disabled</code> at bounds
            </td>
          </tr>
          <tr>
            <td>
              <code>PrevWeeksButton</code> / <code>NextWeeksButton</code>
            </td>
            <td>
              <code>data-direction</code>, native <code>disabled</code> at
              bounds
            </td>
          </tr>
          <tr>
            <td>
              <code>RangeSelected</code> / <code>RangePreview</code>
            </td>
            <td>
              <code>data-active</code>, <code>data-week-index</code>,{" "}
              <code>data-start-index</code>, <code>data-end-index</code>,{" "}
              <code>data-start-date</code>, <code>data-end-date</code>,{" "}
              <code>data-extends-before</code>, <code>data-extends-after</code>,{" "}
              <code>data-has-start</code>, <code>data-has-end</code>,{" "}
              <code>data-orientation</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>RangeStartDragHandle</code> /{" "}
              <code>RangeEndDragHandle</code>
            </td>
            <td>
              <code>data-active</code>, <code>data-dragging</code>,{" "}
              <code>data-edge="start" / "end"</code>,{" "}
              <code>data-orientation</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>WeekNumberCell</code>
            </td>
            <td>
              <code>data-week-number</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>MonthSeparator</code> parts
            </td>
            <td>
              <code>data-month</code>, <code>data-year</code>,{" "}
              <code>data-first-of-year</code>, <code>data-first-visible</code>,{" "}
              <code>data-first-day-column</code>,{" "}
              <code>data-grid-row-start</code>, …
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        The generated API pages (e.g.{" "}
        <a href="/docs/api/DayButtonState">DayButtonState</a>) list the state
        each component exposes; every boolean state maps to a presence attribute
        of the same kebab-cased name.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="styling-day-states-a-range-example">
        Styling day states: a range example
      </Tags.Heading>
      <Tags.Paragraph>
        Range styling composes from the day attributes alone — no extra
        components needed:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="css">
        {
          ".day[data-in-range] {\n  background: #e8e6e1;\n  border-radius: 0;\n}\n\n.day[data-range-start] {\n  border-start-start-radius: 0.375rem;\n  border-end-start-radius: 0.375rem;\n}\n\n.day[data-range-end] {\n  border-start-end-radius: 0.375rem;\n  border-end-end-radius: 0.375rem;\n}\n\n.day[data-range-boundary] {\n  background: #1a1a17;\n  color: #fff;\n}\n\n/* subtler hover preview */\n.day[data-range-preview-in-range] {\n  outline: 1px dashed #b5b3ad;\n}\n"
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="range-overlays-and-">
        Range overlays: <code>RangeSelected</code> and <code>RangePreview</code>
      </Tags.Heading>
      <Tags.Paragraph>
        For pill-shaped range highlights that render <em>behind</em> a whole
        week's days as one element (rather than per-cell backgrounds), add{" "}
        <code>RangeSelected</code> / <code>RangePreview</code> inside your{" "}
        <code>WeekTemplate</code>. They're <code>{"<td>"}</code> overlays that
        report where the range intersects the week: <code>startIndex</code> /{" "}
        <code>endIndex</code> (column positions), <code>extendsBefore</code> /{" "}
        <code>extendsAfter</code> (whether the range continues into adjacent
        weeks — flatten the pill's corners on that side), and{" "}
        <code>active</code> (whether the range touches this week at all).
      </Tags.Paragraph>
      <Tags.Paragraph>
        Because positioning an overlay across table columns requires a CSS-grid
        layout, these are typically used with the <code>render</code> prop:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<WeekTemplate>\n  <RangeSelected\n    render={(props, state) =>\n      state.active ? (\n        <td\n          {...props}\n          className="range-pill"\n          style={{\n            gridRow: 1,\n            gridColumn: `${state.startIndex + 1} / ${state.endIndex + 2}`,\n          }}\n        />\n      ) : (\n        <td {...props} style={{ display: "none" }} />\n      )\n    }\n  />\n  <DayCellTemplate>{/* … */}</DayCellTemplate>\n</WeekTemplate>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        This pairs with laying out <code>Grid</code> as{" "}
        <code>display: grid</code> — see the interactive{" "}
        <a href="/demo">demo</a> source for a complete Tailwind implementation,
        including vertical orientation and week-number offsets.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="grid-layout-tips">
        Grid layout tips
      </Tags.Heading>
      <ul>
        <li>
          <code>Grid</code> renders a <code>{"<table>"}</code>, which styles
          fine for simple calendars. For overlays, subgrid tricks, or vertical
          orientation, restyle it with <code>display: grid</code> — the library
          sets the CSS custom properties <code>--calendar-days-per-week</code>{" "}
          and <code>--calendar-weeks-in-month</code> on the grid element so your
          template can use{" "}
          <code>
            grid-template-columns: repeat(var(--calendar-days-per-week), 1fr)
          </code>
          .
        </li>
        <li>
          <code>WeekTemplate</code> exposes <code>state.gridRowIndex</code>{" "}
          (WeeksView only) and <code>DayCellTemplate</code> exposes{" "}
          <code>state.columnIndex</code> + <code>state.orientation</code> for
          explicit grid placement via <code>render</code>.
        </li>
        <li>
          Don't forget <code>:focus-visible</code> styles on{" "}
          <code>DayButton</code> — see{" "}
          <a href="/docs/accessibility">Accessibility</a>.
        </li>
      </ul>
    </article>
  );
}
