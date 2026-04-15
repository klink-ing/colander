// Auto-generated — do not edit
import * as Tags from "#/components/markdoc-tags";

export const frontmatter = {
  title: "Getting Started",
  description:
    "Install Colander and start building accessible calendar components.",
  order: 1,
  section: "Guides",
};

export default function DocContent() {
  return (
    <>
      <article>
        <Tags.Heading level={2} id="installation">
          Installation
        </Tags.Heading>
        <Tags.InstallCmd />
        <Tags.Heading level={2} id="basic-usage">
          Basic Usage
        </Tags.Heading>
        <Tags.Paragraph>
          Colander provides two calendar views that share state via{" "}
          <code>CalendarProvider</code>:
        </Tags.Paragraph>
        <ul>
          <li>
            <strong>MonthView</strong> — Traditional month grid
          </li>
          <li>
            <strong>WeeksView</strong> — Continuous scrolling weeks
          </li>
        </ul>
        <Tags.Heading level={2} id="quick-example">
          Quick Example
        </Tags.Heading>
        <Tags.ExampleBlock file="basic-calendar.tsx" />
      </article>
    </>
  );
}
