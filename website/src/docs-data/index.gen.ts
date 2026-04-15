// Auto-generated — do not edit
import type { ComponentType } from "react";
import type { DocFrontmatter } from "#/lib/markdoc";

import CalendarProvider, {
  frontmatter as fm0,
} from "./calendar-provider.doc.gen";
import GettingStarted, { frontmatter as fm1 } from "./getting-started.doc.gen";
import MonthView, { frontmatter as fm2 } from "./month-view.doc.gen";
import WeeksView, { frontmatter as fm3 } from "./weeks-view.doc.gen";

export interface DocEntry {
  Component: ComponentType;
  frontmatter: DocFrontmatter;
}

export const docs: Record<string, DocEntry> = {
  "calendar-provider": { Component: CalendarProvider, frontmatter: fm0 },
  "getting-started": { Component: GettingStarted, frontmatter: fm1 },
  "month-view": { Component: MonthView, frontmatter: fm2 },
  "weeks-view": { Component: WeeksView, frontmatter: fm3 },
};
