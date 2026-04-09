import { Temporal } from "@js-temporal/polyfill";
import { bench, describe } from "vitest";
import type { TemporalNamespace } from "./types";
import {
  getMonthWeeks,
  getWeekdayNames,
  computeWeekRangeInfo,
  computeAdjacentMonth,
  isInRange,
  toZonedDateTime,
  fromZonedDateTime,
  resolveFocusTarget,
} from "./utils";

const T: TemporalNamespace = {
  Now: Temporal.Now,
  PlainDate: Temporal.PlainDate,
  PlainDateTime: Temporal.PlainDateTime,
  PlainMonthDay: Temporal.PlainMonthDay,
  PlainYearMonth: Temporal.PlainYearMonth,
};

const timeZone = "America/New_York";

// Pre-computed fixtures
const marchWeeks = getMonthWeeks(2026, 3, T);
const rangeStart = Temporal.PlainDate.from("2026-03-05");
const rangeEnd = Temporal.PlainDate.from("2026-03-20");
const midWeek = marchWeeks[2]; // a week in the middle of the range

describe("getMonthWeeks", () => {
  bench("generate month grid (March 2026)", () => {
    getMonthWeeks(2026, 3, T);
  });

  bench("generate month grid (February — short month)", () => {
    getMonthWeeks(2026, 2, T);
  });

  bench("generate month grid (August — 6-week grid)", () => {
    getMonthWeeks(2026, 8, T);
  });
});

describe("computeWeekRangeInfo", () => {
  bench("week fully inside range", () => {
    computeWeekRangeInfo(midWeek, rangeStart, rangeEnd, T);
  });

  bench("week with no overlap", () => {
    const noOverlapWeek = marchWeeks[marchWeeks.length - 1];
    computeWeekRangeInfo(
      noOverlapWeek,
      Temporal.PlainDate.from("2026-03-01"),
      Temporal.PlainDate.from("2026-03-04"),
      T,
    );
  });

  bench("no range (undefined bounds)", () => {
    computeWeekRangeInfo(midWeek, undefined, undefined, T);
  });

  bench("all 6 weeks of a month", () => {
    for (const week of marchWeeks) {
      computeWeekRangeInfo(week, rangeStart, rangeEnd, T);
    }
  });
});

describe("computeAdjacentMonth", () => {
  bench("next month", () => {
    computeAdjacentMonth({ year: 2026, month: 3 }, "next", T);
  });

  bench("prev month", () => {
    computeAdjacentMonth({ year: 2026, month: 3 }, "prev", T);
  });

  bench("year boundary (Dec → Jan)", () => {
    computeAdjacentMonth({ year: 2026, month: 12 }, "next", T);
  });

  bench("year boundary (Jan → Dec)", () => {
    computeAdjacentMonth({ year: 2026, month: 1 }, "prev", T);
  });
});

describe("isInRange", () => {
  const allDays = marchWeeks.flat();

  bench("single date check (in range)", () => {
    isInRange(Temporal.PlainDate.from("2026-03-10"), rangeStart, rangeEnd, T);
  });

  bench("single date check (out of range)", () => {
    isInRange(Temporal.PlainDate.from("2026-03-25"), rangeStart, rangeEnd, T);
  });

  bench("check all 42 grid cells", () => {
    for (const day of allDays) {
      isInRange(day, rangeStart, rangeEnd, T);
    }
  });

  bench("undefined range (early exit)", () => {
    isInRange(Temporal.PlainDate.from("2026-03-10"), undefined, undefined, T);
  });
});

describe("toZonedDateTime / fromZonedDateTime", () => {
  const plainDate = Temporal.PlainDate.from("2026-03-15");
  const plainDateTime = Temporal.PlainDateTime.from("2026-03-15T10:30:00");
  const nativeDate = new Date(2026, 2, 15, 10, 30, 0);

  bench("PlainDate → ZonedDateTime", () => {
    toZonedDateTime({ format: "PlainDate", value: plainDate }, timeZone, T);
  });

  bench("PlainDateTime → ZonedDateTime", () => {
    toZonedDateTime({ format: "PlainDateTime", value: plainDateTime }, timeZone, T);
  });

  bench("Date → ZonedDateTime", () => {
    toZonedDateTime({ format: "Date", value: nativeDate }, timeZone, T);
  });

  bench("ZonedDateTime → PlainDate", () => {
    const zdt = plainDate.toZonedDateTime(timeZone);
    fromZonedDateTime(zdt, "PlainDate", T);
  });

  bench("ZonedDateTime → object", () => {
    const zdt = plainDate.toZonedDateTime(timeZone);
    fromZonedDateTime(zdt, "object", T);
  });

  bench("round-trip PlainDate → ZDT → PlainDate", () => {
    const zdt = toZonedDateTime({ format: "PlainDate", value: plainDate }, timeZone, T);
    fromZonedDateTime(zdt, "PlainDate", T);
  });
});

describe("getWeekdayNames", () => {
  bench("en-US locale (7× toLocaleString)", () => {
    getWeekdayNames("en-US", T);
  });

  bench("de-DE locale", () => {
    getWeekdayNames("de-DE", T);
  });
});

describe("resolveFocusTarget", () => {
  const selectedDate = Temporal.PlainDate.from("2026-03-15");
  const focusedDate = Temporal.PlainDate.from("2026-03-10");
  const currentMonth = { year: 2026, month: 3 };
  const noDisabled = () => false;

  bench("focused date in grid (fast path)", () => {
    resolveFocusTarget(focusedDate, selectedDate, marchWeeks, currentMonth, noDisabled, T, true);
  });

  bench("selected date fallback", () => {
    // Focus a date outside the grid to force fallback to selectedDate
    const outsideFocus = Temporal.PlainDate.from("2026-05-01");
    resolveFocusTarget(outsideFocus, selectedDate, marchWeeks, currentMonth, noDisabled, T, true);
  });

  bench("no match — linear scan to first enabled", () => {
    const outsideFocus = Temporal.PlainDate.from("2026-05-01");
    const outsideSelected = Temporal.PlainDate.from("2026-05-15");
    resolveFocusTarget(
      outsideFocus,
      outsideSelected,
      marchWeeks,
      currentMonth,
      noDisabled,
      T,
      true,
    );
  });
});
