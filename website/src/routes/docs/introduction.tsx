// Auto-generated from introduction.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Introduction",
  description:
    "What Colander is, the ideas behind it, and how it compares to other React date pickers.",
  order: 1,
  section: "Overview",
};

export const Route = createFileRoute("/docs/introduction")({
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
        Colander is a library of unstyled React components for building
        calendars and date pickers. Instead of shipping a finished date picker
        with a theme to override, it gives you the primitives — grids, day
        cells, navigation buttons, range overlays — that you compose and style
        yourself. You own every pixel; Colander owns the date math, keyboard
        navigation, selection logic, and accessibility semantics.
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          "<MonthView temporal={Temporal} onValueChange={setDate}>\n  <PrevMonthButton>‹</PrevMonthButton>\n  <MonthYearString />\n  <NextMonthButton>›</NextMonthButton>\n  <Grid>\n    <GridHeader>\n      <GridHeaderCell />\n    </GridHeader>\n    <GridBody>\n      <WeekTemplate>\n        <DayCellTemplate>\n          <DayButton />\n        </DayCellTemplate>\n      </WeekTemplate>\n    </GridBody>\n  </Grid>\n</MonthView>\n"
        }
      </Tags.CodeBlock>
      <Tags.Heading level={2} id="core-ideas">
        Core ideas
      </Tags.Heading>
      <Tags.Heading level={3} id="headless-by-design">
        Headless by design
      </Tags.Heading>
      <Tags.Paragraph>
        Every component renders a plain semantic element (
        <code>{"<table>"}</code>, <code>{"<td>"}</code>,{" "}
        <code>{"<button>"}</code>, …) with no CSS attached. You style with any
        tool you already use — plain CSS, Tailwind, CSS-in-JS — through three
        hooks the library exposes:
      </Tags.Paragraph>
      <ul>
        <li>
          <strong>
            <code>className</code>
          </strong>{" "}
          — every component accepts one, like any React element.
        </li>
        <li>
          <strong>
            <code>data-*</code> attributes
          </strong>{" "}
          — interaction state is stamped onto the DOM (
          <code>data-selected</code>, <code>data-today</code>,{" "}
          <code>data-in-range</code>, <code>data-disabled</code>, …), so most
          styling is just CSS attribute selectors.
        </li>
        <li>
          <strong>
            The <code>render</code> prop
          </strong>{" "}
          — swap out the rendered element entirely and receive a fully typed{" "}
          <code>state</code> object, following the same pattern as{" "}
          <a href="https://base-ui.com">Base UI</a>.
        </li>
      </ul>
      <Tags.Paragraph>
        See the <a href="/docs/styling">Styling guide</a> for the full picture.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="temporal-first">
        Temporal-first
      </Tags.Heading>
      <Tags.Paragraph>
        Colander is built on the{" "}
        <a href="https://tc39.es/proposal-temporal/docs/">Temporal API</a> — the
        modern replacement for JavaScript's <code>Date</code>. Selected values
        are precise, immutable Temporal objects (<code>Temporal.PlainDate</code>{" "}
        by default) instead of <code>Date</code> instances that secretly carry a
        time and a time zone. That eliminates the classic date picker bug class:
        off-by-one days caused by implicit UTC/local conversions.
      </Tags.Paragraph>
      <Tags.Paragraph>
        You choose the value type per calendar with the <code>format</code> prop
        — <code>PlainDate</code>, <code>PlainDateTime</code>,{" "}
        <code>ZonedDateTime</code>, a plain object, or even a legacy{" "}
        <code>Date</code> if you're integrating with existing code. The library
        doesn't bundle a Temporal implementation; you pass one in (a ~20 kB
        polyfill today, the built-in <code>Temporal</code> as runtimes ship it).
        See <a href="/docs/dates-and-formats">Dates & formats</a>.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="two-views-one-state-model">
        Two views, one state model
      </Tags.Heading>
      <ul>
        <li>
          <strong>
            <a href="/docs/month-view">MonthView</a>
          </strong>{" "}
          — the traditional paged month grid, including multi-month layouts (up
          to 12 side by side).
        </li>
        <li>
          <strong>
            <a href="/docs/weeks-view">WeeksView</a>
          </strong>{" "}
          — a continuously scrolling window of week rows that spans month
          boundaries, like the mini-calendars in Google Calendar or Fantastical.
          You control how many weeks are visible and scroll by row or by page.
        </li>
      </ul>
      <Tags.Paragraph>
        Both views plug into the same{" "}
        <a href="/docs/calendar-provider">CalendarProvider</a> state: selection
        mode, bounds, locale, and time zone are shared, so you can even render
        both views of the same selection at once.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="selection-built-for-real-products">
        Selection built for real products
      </Tags.Heading>
      <Tags.Paragraph>
        Single, multiple, and range selection are all first-class, each with
        controlled and uncontrolled modes. Range selection goes well beyond
        click-twice: a live hover preview, six configurable policies for what a
        click inside an existing range means (<code>rangeMode</code>), and
        draggable range-boundary handles. See{" "}
        <a href="/docs/selection-modes">Selection modes</a>.
      </Tags.Paragraph>
      <Tags.Heading level={3} id="accessible-by-default">
        Accessible by default
      </Tags.Heading>
      <Tags.Paragraph>
        The grid follows the ARIA grid pattern: roving tab index, arrow-key
        navigation, <code>Home</code> / <code>End</code> / <code>PageUp</code> /{" "}
        <code>PageDown</code>, <code>aria-selected</code> and{" "}
        <code>aria-disabled</code> on day cells, and month labels announced via
        a live region. Details in{" "}
        <a href="/docs/accessibility">Accessibility</a>.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="why-not-another-date-picker">
        Why not another date picker?
      </Tags.Heading>
      <Tags.Paragraph>
        Plenty of good date pickers exist. Colander makes a different set of
        trade-offs:
      </Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th>If you're considering…</th>
            <th>How Colander differs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>react-day-picker</strong>
            </td>
            <td>
              Similar spirit (composable, customizable), but react-day-picker
              works in <code>Date</code> objects and ships default styles to
              override. Colander is Temporal-typed end-to-end, fully unstyled,
              and adds the continuously scrolling WeeksView, range drag handles,
              and hover previews as primitives.
            </td>
          </tr>
          <tr>
            <td>
              <strong>react-datepicker</strong>
            </td>
            <td>
              A batteries-included widget: fast to drop in, hard to restyle
              deeply. Colander is the opposite — more assembly, unlimited
              control over markup and design.
            </td>
          </tr>
          <tr>
            <td>
              <strong>MUI X Date Pickers</strong>
            </td>
            <td>
              Excellent inside a Material UI app; heavy outside one. Colander
              has no design-system dependency and pairs with any styling stack.
            </td>
          </tr>
          <tr>
            <td>
              <strong>React Aria (hooks)</strong>
            </td>
            <td>
              Comparable headless philosophy and strong a11y. React Aria uses
              its own <code>@internationalized/date</code> objects and a
              hooks-first API; Colander uses standard Temporal types and a
              component/compound API, so markup composition stays in JSX.
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.Paragraph>
        Choose Colander when you're building a{" "}
        <strong>design-system-grade calendar</strong> — a component you'll style
        precisely, extend with custom cells or overlays, and keep for years —
        and you want date values that are actually dates.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="when-to-use-it">
        When <em>not</em> to use it
      </Tags.Heading>
      <Tags.Paragraph>Honesty saves you an afternoon:</Tags.Paragraph>
      <ul>
        <li>
          <strong>You want a finished picker in ten minutes.</strong> Colander
          has no default stylesheet. If you don't want to write styles, use a
          styled library.
        </li>
        <li>
          <strong>You can't add a Temporal polyfill.</strong> Until{" "}
          <code>Temporal</code> lands natively in the runtimes you target,
          you'll ship a small polyfill (see the{" "}
          <a href="/docs/quick-start">Quick start</a>).
        </li>
      </ul>
      <Tags.Callout type="warning">
        <Tags.Paragraph>
          Colander is <strong>pre-stable</strong>. The API is still evolving and
          releases are published to the <code>alpha</code> npm dist-tag. Pin
          your version and read release notes when upgrading. The first stable
          release will be <code>3.0.0</code>.
        </Tags.Paragraph>
      </Tags.Callout>
      <Tags.Heading level={2} id="next-steps">
        Next steps
      </Tags.Heading>
      <ul>
        <li>
          <a href="/docs/quick-start">Quick start</a> — install and build your
          first calendar.
        </li>
        <li>
          <a href="/docs/composition">Composition</a> — how the pieces fit
          together.
        </li>
        <li>
          <a href="/docs/styling">Styling</a> — the data-attribute and
          render-prop styling model.
        </li>
      </ul>
    </article>
  );
}
