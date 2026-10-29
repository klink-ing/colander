// Auto-generated from accessibility.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Accessibility",
  description:
    "Keyboard interactions, ARIA semantics, and localization built into Colander.",
  order: 3,
  section: "Overview",
};

export const Route = createFileRoute("/docs/accessibility")({
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
        Colander implements the{" "}
        <a href="https://www.w3.org/WAI/ARIA/apg/patterns/grid/">
          ARIA grid pattern
        </a>{" "}
        for calendars, so the markup you compose is accessible before you write
        a line of ARIA yourself. This page describes what the library does for
        you — and the few things left in your hands.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="keyboard-interactions">
        Keyboard interactions
      </Tags.Heading>
      <Tags.Paragraph>Focus the grid, then:</Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>ArrowRight</code> / <code>ArrowLeft</code>
            </td>
            <td>Move focus one day forward / back</td>
          </tr>
          <tr>
            <td>
              <code>ArrowDown</code> / <code>ArrowUp</code>
            </td>
            <td>Move focus one week forward / back</td>
          </tr>
          <tr>
            <td>
              <code>Home</code> / <code>End</code>
            </td>
            <td>
              Move focus to the first / last day of the week (respects{" "}
              <code>weekStartDay</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>PageDown</code> / <code>PageUp</code>
            </td>
            <td>Move focus one month forward / back</td>
          </tr>
          <tr>
            <td>
              <code>Shift + PageDown</code> / <code>Shift + PageUp</code>
            </td>
            <td>Move focus one year forward / back</td>
          </tr>
          <tr>
            <td>
              <code>Enter</code> / <code>Space</code>
            </td>
            <td>Select the focused day</td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        Movement is clamped to your <code>min</code>/<code>max</code> bounds —
        focus stops at the boundary instead of escaping the selectable window.
        When focus crosses a month boundary, the view follows automatically
        (MonthView pages; WeeksView scrolls its window).
      </Tags.Paragraph>
      <Tags.Paragraph>
        In a <code>readOnly</code> calendar, navigation still works but{" "}
        <code>Enter</code>/<code>Space</code> do nothing. In a{" "}
        <code>disabled</code> calendar, keyboard interaction is off entirely.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="focus-management">
        Focus management
      </Tags.Heading>
      <Tags.Paragraph>
        The grid uses a <strong>roving tab index</strong>: exactly one day cell
        is in the tab order at a time, so the calendar occupies a single tab
        stop in the page. The tab target is the selected day when there is one,
        otherwise today, otherwise the nearest sensible day in view.
      </Tags.Paragraph>
      <Tags.Paragraph>
        Pass <code>autoFocus</code> to <code>Grid</code> to move DOM focus into
        the grid when it mounts — useful when the calendar opens inside a
        popover:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {"<Grid autoFocus>{/* … */}</Grid>\n"}
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="semantics-and-labelling">
        Semantics and labelling
      </Tags.Heading>
      <ul>
        <li>
          <code>Grid</code> renders a <code>{'<table role="grid">'}</code>;{" "}
          <code>DayCellTemplate</code> renders{" "}
          <code>{'<td role="gridcell">'}</code> cells with{" "}
          <code>aria-selected</code> and <code>aria-disabled</code> reflecting
          state.
        </li>
        <li>
          Each <code>DayButton</code> gets a full-date <code>aria-label</code>{" "}
          (e.g. "Saturday, June 20, 2026"), localized with your{" "}
          <code>locale</code>.
        </li>
        <li>
          <code>GridHeaderCell</code> renders abbreviated weekday text with the
          full weekday name as its <code>aria-label</code>.
        </li>
        <li>
          When you render a <code>MonthYearString</code>, the grid is
          automatically linked to it with <code>aria-labelledby</code>, giving
          screen-reader users the "June 2026" context. Without one, the grid
          falls back to <code>aria-label="Calendar"</code>.
        </li>
        <li>
          <code>MonthYearString</code>, <code>DateString</code>, and{" "}
          <code>TimeString</code> render with <code>aria-live="polite"</code>,
          so month navigation and selection changes are announced without
          stealing focus.
        </li>
        <li>
          <code>PrevMonthButton</code> / <code>NextMonthButton</code> (and the
          WeeksView equivalents) carry descriptive <code>aria-label</code>s and
          use the native <code>disabled</code> attribute at bounds, so assistive
          tech sees real button semantics.
        </li>
      </ul>
      <Tags.Heading level={2} id="outside-and-hidden-days">
        Outside and hidden days
      </Tags.Heading>
      <Tags.Paragraph>
        <code>outsideDays="hidden"</code> keeps the grid shape intact for
        assistive tech: hidden cells stay in the DOM as empty{" "}
        <code>{"<td>"}</code> elements with <code>aria-hidden</code> (and a{" "}
        <code>data-hidden</code> styling hook) rather than being removed, so row
        and column counts remain consistent.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="range-drag-handles">
        Range drag handles
      </Tags.Heading>
      <Tags.Paragraph>
        <code>RangeStartDragHandle</code> / <code>RangeEndDragHandle</code> are
        pointer affordances layered on top of the keyboard-accessible selection
        model. They expose <code>aria-roledescription="drag handle"</code>, a
        label for the boundary they control, and <code>aria-valuetext</code>{" "}
        with the current date — and they are <code>aria-hidden</code> while
        inactive. Because every range operation can also be performed by
        clicking or with the keyboard, dragging is an enhancement, not a
        requirement.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="localization">
        Localization
      </Tags.Heading>
      <ul>
        <li>
          <strong>
            <code>locale</code>
          </strong>{" "}
          (BCP 47 string, default <code>"en-US"</code>) drives every formatted
          string: weekday headers, month/year labels, and day{" "}
          <code>aria-label</code>s, all via <code>Intl.DateTimeFormat</code>.
        </li>
        <li>
          <strong>
            <code>weekStartDay</code>
          </strong>{" "}
          (0 = Sunday … 6 = Saturday) reorders the grid <em>and</em> the{" "}
          <code>Home</code>/<code>End</code> keyboard behavior together, so
          visual and keyboard order never disagree.
        </li>
        <li>
          <strong>
            <code>timeZone</code>
          </strong>{" "}
          (IANA identifier) controls which day is "today" and how values
          convert. See <a href="/docs/dates-and-formats">Dates & formats</a>.
        </li>
      </ul>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView temporal={Temporal} locale="de-DE" weekStartDay={1}>\n  {/* Mo Di Mi Do Fr Sa So */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="your-responsibilities">
        Your responsibilities
      </Tags.Heading>
      <Tags.Paragraph>Headless means a few things remain yours:</Tags.Paragraph>
      <ul>
        <li>
          <strong>Visible focus.</strong> Style <code>:focus-visible</code> on{" "}
          <code>DayButton</code> (and the nav buttons) with a clearly visible
          ring; the library manages <em>where</em> focus goes, you make it{" "}
          <em>seen</em>.
        </li>
        <li>
          <strong>Color contrast.</strong> Selected, in-range, disabled, and
          outside-month states are your colors — keep them WCAG-compliant, and
          don't rely on color alone to convey selection.
        </li>
        <li>
          <strong>Hit targets.</strong> Keep day buttons comfortably tappable
          (44×44 px is a good floor) if you target touch devices.
        </li>
      </ul>
    </article>
  );
}
