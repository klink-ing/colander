// Auto-generated from quick-start.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Quick start",
  description:
    "Install Colander and build a working, styled calendar in a few minutes.",
  order: 2,
  section: "Overview",
};

export const Route = createFileRoute("/docs/quick-start")({
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
        This walkthrough takes you from an empty file to a working, styled month
        calendar.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="install-the-package">
        Install the package
      </Tags.Heading>
      <Tags.Paragraph>
        Install @klinking/colander and a Temporal polyfill in your React
        project:
      </Tags.Paragraph>
      <Tags.InstallCmd />
      <Tags.Paragraph>
        Colander has three peer dependencies — <code>react</code>,{" "}
        <code>react-dom</code> (18+), and <code>@base-ui/react</code> — which
        your package manager installs automatically. The Temporal polyfill is
        explicit on purpose: the library doesn't bundle one, so you control
        which implementation you ship (see{" "}
        <a href="/docs/dates-and-formats">Dates & formats</a> for the options).
      </Tags.Paragraph>
      <Tags.Callout type="info">
        <Tags.Paragraph>
          Releases are currently published to the{" "}
          <strong>
            <code>alpha</code>
          </strong>{" "}
          dist-tag while the API stabilizes —{" "}
          <code>@klinking/colander@alpha</code> installs the latest prerelease.
        </Tags.Paragraph>
      </Tags.Callout>
      <Tags.Heading level={2} id="provide-temporal">
        Provide Temporal
      </Tags.Heading>
      <Tags.Paragraph>
        Every calendar needs a <code>Temporal</code> implementation. Import it
        once and pass it via the <code>temporal</code> prop:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'import { Temporal } from "@js-temporal/polyfill";\n\n<MonthView temporal={Temporal}>{/* … */}</MonthView>;\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        If the runtime already exposes the native <code>Temporal</code> global,
        the prop can be omitted.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="assemble-the-calendar">
        Assemble the calendar
      </Tags.Heading>
      <Tags.Paragraph>
        Colander components are compound parts you compose in JSX, so your
        markup mirrors the calendar's actual structure. Here is a complete
        single-month calendar with navigation:
      </Tags.Paragraph>
      <Tags.ExampleBlock file="basic-calendar.tsx" />
      <Tags.Paragraph>A quick tour of the parts:</Tags.Paragraph>
      <ul>
        <li>
          <strong>
            <code>MonthView</code>
          </strong>{" "}
          — the all-in-one root. It owns selection state and month navigation,
          and reports selection through <code>onValueChange</code>. (Under the
          hood it composes a{" "}
          <a href="/docs/calendar-provider">CalendarProvider</a> with a{" "}
          <code>MonthView.Root</code> — you can also use those two directly when
          you need more control.)
        </li>
        <li>
          <strong>
            <code>PrevMonthButton</code> / <code>NextMonthButton</code>
          </strong>{" "}
          — <code>{"<button>"}</code>s that page the visible month and disable
          themselves at your <code>min</code>/<code>max</code> bounds.
        </li>
        <li>
          <strong>
            <code>MonthYearString</code>
          </strong>{" "}
          — a localized "June 2026" label, wired to the grid via{" "}
          <code>aria-labelledby</code> and announced politely when the month
          changes.
        </li>
        <li>
          <strong>
            <code>Grid</code>, <code>GridHeader</code>,{" "}
            <code>GridHeaderCell</code>, <code>GridBody</code>
          </strong>{" "}
          — the calendar table. A single <code>GridHeaderCell</code> with no{" "}
          <code>index</code> renders all seven localized weekday headers.
        </li>
        <li>
          <strong>
            <code>WeekTemplate</code> / <code>DayCellTemplate</code> /{" "}
            <code>DayButton</code>
          </strong>{" "}
          — <em>templates</em>: you write one row, one cell, and one button, and
          the library stamps them out for every week and day in view.
        </li>
      </ul>
      <Tags.Heading level={2} id="read-the-selection">
        Read the selection
      </Tags.Heading>
      <Tags.Paragraph>
        <code>onValueChange</code> receives the new value in your configured
        format — a <code>Temporal.PlainDate | null</code> by default:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'function BookingForm() {\n  const [date, setDate] = useState<Temporal.PlainDate | null>(null);\n\n  return (\n    <>\n      <BasicCalendar onSelect={setDate} />\n      <p>{date ? date.toLocaleString() : "Pick a date"}</p>\n    </>\n  );\n}\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        The example above is <em>uncontrolled</em> (the calendar keeps its own
        state). To control it, pass <code>value</code> and update it from{" "}
        <code>onValueChange</code> — see{" "}
        <a href="/docs/selection-modes">Selection modes</a> for the full rules,
        plus range and multi-select.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="style-it">
        Style it
      </Tags.Heading>
      <Tags.Paragraph>
        Nothing you've rendered so far has any appearance — that's yours.
        Components accept <code>className</code> like any element, and they
        expose their interaction state as <code>data-*</code> attributes, so
        most styling is plain CSS:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="css">
        {
          ".calendar {\n  inline-size: 20rem;\n  font: inherit;\n}\n\n.calendar-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-block-end: 0.5rem;\n}\n\n.calendar-nav {\n  inline-size: 2rem;\n  block-size: 2rem;\n  border: none;\n  border-radius: 0.375rem;\n  background: transparent;\n  cursor: pointer;\n}\n\n.calendar-nav:hover {\n  background: #f1f0ef;\n}\n\n.calendar-nav:disabled {\n  opacity: 0.4;\n  cursor: default;\n}\n\n.calendar-grid {\n  inline-size: 100%;\n  border-collapse: collapse;\n}\n\n.calendar-weekday {\n  padding-block: 0.25rem;\n  font-size: 0.75rem;\n  font-weight: 500;\n  color: #6f6d66;\n}\n\n.calendar-day {\n  inline-size: 2.25rem;\n  block-size: 2.25rem;\n  border: none;\n  border-radius: 0.375rem;\n  background: transparent;\n  cursor: pointer;\n}\n\n.calendar-day:hover {\n  background: #f1f0ef;\n}\n\n.calendar-day[data-today] {\n  font-weight: 700;\n}\n\n.calendar-day[data-outside-month] {\n  color: #b5b3ad;\n}\n\n.calendar-day[data-selected] {\n  background: #1a1a17;\n  color: #fff;\n}\n\n.calendar-day[data-disabled] {\n  opacity: 0.4;\n  cursor: default;\n}\n"
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        The <a href="/docs/styling">Styling guide</a> covers the complete
        data-attribute reference, Tailwind usage, and the <code>render</code>{" "}
        prop for cases where CSS alone isn't enough.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="next-steps">
        Next steps
      </Tags.Heading>
      <ul>
        <li>
          <a href="/docs/composition">Composition</a> — the component tree,
          templates, and the <code>render</code> prop.
        </li>
        <li>
          <a href="/docs/selection-modes">Selection modes</a> — single,
          multiple, and range selection.
        </li>
        <li>
          <a href="/docs/dates-and-formats">Dates & formats</a> — value formats,
          time zones, and locales.
        </li>
        <li>
          <a href="/docs/month-view">MonthView</a> and{" "}
          <a href="/docs/weeks-view">WeeksView</a> — everything each view can
          do.
        </li>
      </ul>
    </article>
  );
}
