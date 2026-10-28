import { Temporal } from "@js-temporal/polyfill";
import { test, describe } from "vite-plus/test";
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
const midWeek = marchWeeks[2]!; // a week in the middle of the range

describe("getMonthWeeks", () => {
  test("generate month grid (March 2026)", async ({ bench }) => {
    await bench("generate month grid (March 2026)", () => {
      getMonthWeeks(2026, 3, T);
    }).run();
  });

  test("generate month grid (February — short month)", async ({ bench }) => {
    await bench("generate month grid (February — short month)", () => {
      getMonthWeeks(2026, 2, T);
    }).run();
  });

  test("generate month grid (August — 6-week grid)", async ({ bench }) => {
    await bench("generate month grid (August — 6-week grid)", () => {
      getMonthWeeks(2026, 8, T);
    }).run();
  });
});

describe("computeWeekRangeInfo", () => {
  test("week fully inside range", async ({ bench }) => {
    await bench("week fully inside range", () => {
      computeWeekRangeInfo(midWeek, rangeStart, rangeEnd, T);
    }).run();
  });

  test("week with no overlap", async ({ bench }) => {
    await bench("week with no overlap", () => {
      const noOverlapWeek = marchWeeks[marchWeeks.length - 1]!;
      computeWeekRangeInfo(
        noOverlapWeek,
        Temporal.PlainDate.from("2026-03-01"),
        Temporal.PlainDate.from("2026-03-04"),
        T,
      );
    }).run();
  });

  test("no range (undefined bounds)", async ({ bench }) => {
    await bench("no range (undefined bounds)", () => {
      computeWeekRangeInfo(midWeek, undefined, undefined, T);
    }).run();
  });

  test("all 6 weeks of a month", async ({ bench }) => {
    await bench("all 6 weeks of a month", () => {
      for (const week of marchWeeks) {
        computeWeekRangeInfo(week, rangeStart, rangeEnd, T);
      }
    }).run();
  });
});

describe("computeAdjacentMonth", () => {
  test("next month", async ({ bench }) => {
    await bench("next month", () => {
      computeAdjacentMonth({ year: 2026, month: 3 }, "next", T);
    }).run();
  });

  test("prev month", async ({ bench }) => {
    await bench("prev month", () => {
      computeAdjacentMonth({ year: 2026, month: 3 }, "prev", T);
    }).run();
  });

  test("year boundary (Dec → Jan)", async ({ bench }) => {
    await bench("year boundary (Dec → Jan)", () => {
      computeAdjacentMonth({ year: 2026, month: 12 }, "next", T);
    }).run();
  });

  test("year boundary (Jan → Dec)", async ({ bench }) => {
    await bench("year boundary (Jan → Dec)", () => {
      computeAdjacentMonth({ year: 2026, month: 1 }, "prev", T);
    }).run();
  });
});

describe("isInRange", () => {
  const allDays = marchWeeks.flat();

  test("single date check (in range)", async ({ bench }) => {
    await bench("single date check (in range)", () => {
      isInRange(Temporal.PlainDate.from("2026-03-10"), rangeStart, rangeEnd, T);
    }).run();
  });

  test("single date check (out of range)", async ({ bench }) => {
    await bench("single date check (out of range)", () => {
      isInRange(Temporal.PlainDate.from("2026-03-25"), rangeStart, rangeEnd, T);
    }).run();
  });

  test("check all 42 grid cells", async ({ bench }) => {
    await bench("check all 42 grid cells", () => {
      for (const day of allDays) {
        isInRange(day, rangeStart, rangeEnd, T);
      }
    }).run();
  });

  test("undefined range (early exit)", async ({ bench }) => {
    await bench("undefined range (early exit)", () => {
      isInRange(Temporal.PlainDate.from("2026-03-10"), undefined, undefined, T);
    }).run();
  });
});

describe("toZonedDateTime / fromZonedDateTime", () => {
  const plainDate = Temporal.PlainDate.from("2026-03-15");
  const plainDateTime = Temporal.PlainDateTime.from("2026-03-15T10:30:00");
  const nativeDate = new Date(2026, 2, 15, 10, 30, 0);

  test("PlainDate → ZonedDateTime", async ({ bench }) => {
    await bench("PlainDate → ZonedDateTime", () => {
      toZonedDateTime({ format: "PlainDate", value: plainDate }, timeZone, T);
    }).run();
  });

  test("PlainDateTime → ZonedDateTime", async ({ bench }) => {
    await bench("PlainDateTime → ZonedDateTime", () => {
      toZonedDateTime(
        { format: "PlainDateTime", value: plainDateTime },
        timeZone,
        T,
      );
    }).run();
  });

  test("Date → ZonedDateTime", async ({ bench }) => {
    await bench("Date → ZonedDateTime", () => {
      toZonedDateTime({ format: "Date", value: nativeDate }, timeZone, T);
    }).run();
  });

  test("ZonedDateTime → PlainDate", async ({ bench }) => {
    await bench("ZonedDateTime → PlainDate", () => {
      const zdt = plainDate.toZonedDateTime(timeZone);
      fromZonedDateTime(zdt, "PlainDate", T);
    }).run();
  });

  test("ZonedDateTime → object", async ({ bench }) => {
    await bench("ZonedDateTime → object", () => {
      const zdt = plainDate.toZonedDateTime(timeZone);
      fromZonedDateTime(zdt, "object", T);
    }).run();
  });

  test("round-trip PlainDate → ZDT → PlainDate", async ({ bench }) => {
    await bench("round-trip PlainDate → ZDT → PlainDate", () => {
      const zdt = toZonedDateTime(
        { format: "PlainDate", value: plainDate },
        timeZone,
        T,
      );
      fromZonedDateTime(zdt, "PlainDate", T);
    }).run();
  });
});

describe("getWeekdayNames", () => {
  test("en-US locale (7× toLocaleString)", async ({ bench }) => {
    await bench("en-US locale (7× toLocaleString)", () => {
      getWeekdayNames("en-US", T);
    }).run();
  });

  test("de-DE locale", async ({ bench }) => {
    await bench("de-DE locale", () => {
      getWeekdayNames("de-DE", T);
    }).run();
  });
});

describe("resolveFocusTarget", () => {
  const selectedDate = Temporal.PlainDate.from("2026-03-15");
  const focusedDate = Temporal.PlainDate.from("2026-03-10");
  const currentMonth = { year: 2026, month: 3 };
  const noDisabled = () => false;

  test("focused date in grid (fast path)", async ({ bench }) => {
    await bench("focused date in grid (fast path)", () => {
      resolveFocusTarget(
        focusedDate,
        selectedDate,
        marchWeeks,
        currentMonth,
        noDisabled,
        T,
        true,
      );
    }).run();
  });

  test("selected date fallback", async ({ bench }) => {
    await bench("selected date fallback", () => {
      // Focus a date outside the grid to force fallback to selectedDate
      const outsideFocus = Temporal.PlainDate.from("2026-05-01");
      resolveFocusTarget(
        outsideFocus,
        selectedDate,
        marchWeeks,
        currentMonth,
        noDisabled,
        T,
        true,
      );
    }).run();
  });

  test("no match — linear scan to first enabled", async ({ bench }) => {
    await bench("no match — linear scan to first enabled", () => {
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
    }).run();
  });
});
