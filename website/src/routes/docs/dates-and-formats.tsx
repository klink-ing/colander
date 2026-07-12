// Auto-generated from dates-and-formats.md — do not edit
import { createFileRoute } from "@tanstack/react-router";
import * as Tags from "#/components/markdoc";
import { PROJECT_NAME } from "#/config";

const frontmatter = {
  title: "Dates & formats",
  description:
    "Temporal, the temporal prop, value formats, subpath entry points, time zones, and locales.",
  order: 13,
  section: "Guides",
};

export const Route = createFileRoute("/docs/dates-and-formats")({
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
        Colander does its date math with the{" "}
        <a href="https://tc39.es/proposal-temporal/docs/">Temporal API</a> —
        JavaScript's modern, immutable, time-zone-explicit date library. This
        page covers how to supply a Temporal implementation, how to choose what
        type your selected <em>values</em> are, and how time zones and locales
        flow through the calendar.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="providing-temporal">
        Providing Temporal
      </Tags.Heading>
      <Tags.Paragraph>
        The library deliberately doesn't bundle a Temporal implementation. Pass
        one through the <code>temporal</code> prop on{" "}
        <code>CalendarProvider</code> (or the <code>MonthView</code>/
        <code>WeeksView</code> wrappers):
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'import { Temporal } from "@js-temporal/polyfill";\n\n<MonthView temporal={Temporal}>{/* … */}</MonthView>;\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>Two well-supported polyfills:</Tags.Paragraph>
      <ul>
        <li>
          <a href="https://github.com/fullcalendar/temporal-polyfill">
            <code>temporal-polyfill</code>
          </a>{" "}
          — smaller (~20 kB min+gzip), production-oriented.
        </li>
        <li>
          <a href="https://github.com/js-temporal/temporal-polyfill">
            <code>@js-temporal/polyfill</code>
          </a>{" "}
          — the champions' reference-quality polyfill.
        </li>
      </ul>
      <Tags.Paragraph>
        If <code>temporal</code> is omitted, the library falls back to the
        native <code>globalThis.Temporal</code> and throws a descriptive error
        when neither exists. As runtimes ship Temporal natively, you delete the
        polyfill and the prop — nothing else changes.
      </Tags.Paragraph>
      <Tags.Callout type="info">
        <Tags.Paragraph>
          Whichever polyfill you choose, import it in <strong>one place</strong>{" "}
          and pass the same namespace to every calendar. Temporal objects from
          different implementations shouldn't be mixed.
        </Tags.Paragraph>
      </Tags.Callout>
      <Tags.Heading level={2} id="the-prop">
        The <code>format</code> prop
      </Tags.Heading>
      <Tags.Paragraph>
        Internally the calendar always works in Temporal types. The{" "}
        <code>format</code> prop chooses the type of the values that cross the
        boundary to <em>your</em> code — <code>value</code>,{" "}
        <code>defaultValue</code>, <code>min</code>, <code>max</code>, and the
        payloads of <code>onValueChange</code>:
      </Tags.Paragraph>
      <table>
        <thead>
          <tr>
            <th>
              <code>format</code>
            </th>
            <th>Value type</th>
            <th>Use when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>"PlainDate"</code> <em>(default)</em>
            </td>
            <td>
              <code>Temporal.PlainDate</code>
            </td>
            <td>You need a calendar date, nothing more. The right default.</td>
          </tr>
          <tr>
            <td>
              <code>"PlainDateTime"</code>
            </td>
            <td>
              <code>Temporal.PlainDateTime</code>
            </td>
            <td>
              A date with a wall-clock time (existing time is preserved when the
              date changes).
            </td>
          </tr>
          <tr>
            <td>
              <code>"ZonedDateTime"</code>
            </td>
            <td>
              <code>Temporal.ZonedDateTime</code>
            </td>
            <td>A precise instant in a time zone.</td>
          </tr>
          <tr>
            <td>
              <code>"PlainYearMonth"</code>
            </td>
            <td>
              <code>Temporal.PlainYearMonth</code>
            </td>
            <td>Month-granularity values.</td>
          </tr>
          <tr>
            <td>
              <code>"PlainMonthDay"</code>
            </td>
            <td>
              <code>Temporal.PlainMonthDay</code>
            </td>
            <td>Recurring dates like birthdays.</td>
          </tr>
          <tr>
            <td>
              <code>"object"</code>
            </td>
            <td>
              <code>{"{ year, month, day, … }"}</code>
            </td>
            <td>
              Framework-agnostic plain objects (serialization, form state).
            </td>
          </tr>
          <tr>
            <td>
              <code>"Date"</code>
            </td>
            <td>
              <code>Date</code>
            </td>
            <td>
              Interop with legacy code that speaks <code>Date</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView\n  temporal={Temporal}\n  format="ZonedDateTime"\n  timeZone="America/New_York"\n  onValueChange={(value) => {\n    // value: Temporal.ZonedDateTime | null\n  }}\n>\n  {/* … */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        The <code>format</code> only shapes the <em>props and callbacks</em>.
        Render-prop <code>state</code> objects and hook values always expose
        plain Temporal types (<code>Temporal.PlainDate</code> days, etc.)
        regardless of format, so component code stays uniform.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="format-narrowed-entry-points">
        Format-narrowed entry points
      </Tags.Heading>
      <Tags.Paragraph>
        The main entry point types values with a generic parameter. If you'd
        rather have the types pre-narrowed — and skip passing{" "}
        <code>format</code> — import from a format subpath:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          'import {\n  MonthView,\n  type DateRange, // already DateRange<"PlainDate">\n} from "@klinking/colander/plain-date";\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Available subpaths: <code>/plain-date</code>,{" "}
        <code>/plain-date-time</code>, <code>/plain-month-day</code>,{" "}
        <code>/plain-year-month</code>, <code>/zoned-date-time</code>,{" "}
        <code>/object</code>, and <code>/date</code>. Each re-exports the whole
        API with <code>CalendarProvider</code>, <code>MonthView</code>,{" "}
        <code>WeeksView</code>, and the value types bound to that format.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="bounds-and-disabled-dates">
        Bounds and disabled dates
      </Tags.Heading>
      <Tags.Paragraph>
        <code>min</code> and <code>max</code> (in your value format) disable
        everything outside them, and keyboard focus is clamped to the bounds.{" "}
        <code>isDateDisabled</code> handles irregular rules and always receives
        a <code>Temporal.PlainDate</code>:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView\n  temporal={Temporal}\n  min={Temporal.PlainDate.from("2026-01-01")}\n  max={Temporal.PlainDate.from("2026-12-31")}\n  isDateDisabled={(date) => holidays.has(date.toString())}\n>\n  {/* … */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Bounds restrict <em>selection</em>. Whether users can still scroll the
        view past them is the per-view <code>outOfRangeBehavior</code> prop —
        see <a href="/docs/month-view">MonthView</a> and{" "}
        <a href="/docs/weeks-view">WeeksView</a>.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="time-zones">
        Time zones
      </Tags.Heading>
      <Tags.Paragraph>
        <code>timeZone</code> (an IANA identifier, defaulting to the system
        zone) determines:
      </Tags.Paragraph>
      <ul>
        <li>
          which day is highlighted as <strong>today</strong>,
        </li>
        <li>how partial or zoned values convert to grid days,</li>
        <li>
          the zone of emitted <code>ZonedDateTime</code> values.
        </li>
      </ul>
      <Tags.Paragraph>
        Plain formats like <code>PlainDate</code> are zone-independent by nature
        — selecting June 20 means June 20, no matter where the user is. That's
        most of the reason to prefer them.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="locale-and-week-start">
        Locale and week start
      </Tags.Heading>
      <Tags.Paragraph>
        <code>locale</code> (BCP 47, default <code>"en-US"</code>) localizes
        weekday headers, month/year labels, and day <code>aria-label</code>s via{" "}
        <code>Intl.DateTimeFormat</code>. It does <strong>not</strong> change
        the week's first day — that's explicit, so it never surprises you:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthView temporal={Temporal} locale="fr-FR" weekStartDay={1}>\n  {/* lun. mar. mer. jeu. ven. sam. dim. */}\n</MonthView>\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        <code>weekStartDay</code> takes <code>0</code> (Sunday, default) through{" "}
        <code>6</code> (Saturday) and consistently drives the grid column order,
        week-number calculations, and <code>Home</code>/<code>End</code>{" "}
        keyboard navigation.
      </Tags.Paragraph>
      <Tags.Heading level={2} id="displaying-values">
        Displaying values
      </Tags.Heading>
      <Tags.Paragraph>
        For formatted output inside the calendar, use the built-in string
        components — they read the calendar's <code>locale</code> and accept{" "}
        <code>Intl.DateTimeFormat</code> options:
      </Tags.Paragraph>
      <Tags.CodeBlock data-language="tsx">
        {
          '<MonthYearString options={{ month: "long", year: "numeric" }} />\n<DateString options={{ dateStyle: "full" }} />\n<TimeString options={{ timeStyle: "short" }} />\n'
        }
      </Tags.CodeBlock>
      <Tags.Paragraph>
        Outside the calendar, Temporal values format themselves:{" "}
        <code>{'date.toLocaleString("de-DE", { dateStyle: "long" })'}</code>.
      </Tags.Paragraph>
    </article>
  );
}
