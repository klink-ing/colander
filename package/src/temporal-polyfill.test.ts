import { describe, it, expect } from "vitest";
import { Temporal } from "./temporal-polyfill";

const T = Temporal;

function date(iso: string) {
  return T.PlainDate.from(iso);
}

describe("PlainDate.from", () => {
  it("parses ISO string", () => {
    const d = date("2026-03-15");
    expect(d.year).toBe(2026);
    expect(d.month).toBe(3);
    expect(d.day).toBe(15);
  });

  it("parses ISO string with time portion (ignores time)", () => {
    const d = T.PlainDate.from("2026-03-15T10:30:00");
    expect(d.year).toBe(2026);
    expect(d.month).toBe(3);
    expect(d.day).toBe(15);
  });

  it("creates from object", () => {
    const d = T.PlainDate.from({ year: 2026, month: 2, day: 28 });
    expect(d.toString()).toBe("2026-02-28");
  });

  it("constrains overflow day", () => {
    const d = T.PlainDate.from({ year: 2026, month: 2, day: 31 }, { overflow: "constrain" });
    expect(d.day).toBe(28);
  });

  it("constrains overflow day for leap year", () => {
    const d = T.PlainDate.from({ year: 2024, month: 2, day: 31 }, { overflow: "constrain" });
    expect(d.day).toBe(29);
  });
});

describe("PlainDate.compare", () => {
  it.each<{
    description: string;
    a: string;
    b: string;
    expected: number;
  }>([
    {
      description: "equal dates",
      a: "2026-03-15",
      b: "2026-03-15",
      expected: 0,
    },
    {
      description: "a before b (day)",
      a: "2026-03-14",
      b: "2026-03-15",
      expected: -1,
    },
    {
      description: "a after b (day)",
      a: "2026-03-16",
      b: "2026-03-15",
      expected: 1,
    },
    {
      description: "a before b (month)",
      a: "2026-02-15",
      b: "2026-03-15",
      expected: -1,
    },
    {
      description: "a before b (year)",
      a: "2025-03-15",
      b: "2026-03-15",
      expected: -1,
    },
  ])("$description", ({ a, b, expected }) => {
    expect(T.PlainDate.compare(date(a), date(b))).toBe(expected);
  });
});

describe("PlainDate add/subtract", () => {
  it("adds days", () => {
    expect(date("2026-03-15").add({ days: 5 }).toString()).toBe("2026-03-20");
  });

  it("adds weeks", () => {
    expect(date("2026-03-15").add({ weeks: 2 }).toString()).toBe("2026-03-29");
  });

  it("adds months with day clamping (Jan 31 + 1 month)", () => {
    expect(date("2026-01-31").add({ months: 1 }).toString()).toBe("2026-02-28");
  });

  it("adds months with day clamping (Jan 31 + 1 month, leap year)", () => {
    expect(date("2024-01-31").add({ months: 1 }).toString()).toBe("2024-02-29");
  });

  it("subtracts days", () => {
    expect(date("2026-03-15").subtract({ days: 5 }).toString()).toBe("2026-03-10");
  });

  it("subtracts months", () => {
    expect(date("2026-03-31").subtract({ months: 1 }).toString()).toBe("2026-02-28");
  });

  it("crosses year boundary forward", () => {
    expect(date("2026-12-31").add({ days: 1 }).toString()).toBe("2027-01-01");
  });

  it("crosses year boundary backward", () => {
    expect(date("2027-01-01").subtract({ days: 1 }).toString()).toBe("2026-12-31");
  });

  it("adds months crossing year boundary", () => {
    expect(date("2026-11-15").add({ months: 3 }).toString()).toBe("2027-02-15");
  });
});

describe("PlainDate since/until", () => {
  it("positive days", () => {
    expect(date("2026-03-20").since(date("2026-03-10")).days).toBe(10);
  });

  it("negative days", () => {
    expect(date("2026-03-10").since(date("2026-03-20")).days).toBe(-10);
  });

  it("zero days", () => {
    expect(date("2026-03-15").since(date("2026-03-15")).days).toBe(0);
  });

  it("until returns positive for future dates", () => {
    expect(date("2026-03-10").until(date("2026-03-20")).days).toBe(10);
  });
});

describe("PlainDate dayOfWeek", () => {
  it.each<{ description: string; d: string; expected: number }>([
    { description: "2026-03-15 is Sunday", d: "2026-03-15", expected: 7 },
    { description: "2026-03-16 is Monday", d: "2026-03-16", expected: 1 },
    { description: "2026-03-17 is Tuesday", d: "2026-03-17", expected: 2 },
    { description: "2026-03-21 is Saturday", d: "2026-03-21", expected: 6 },
  ])("$description", ({ d, expected }) => {
    expect(date(d).dayOfWeek).toBe(expected);
  });
});

describe("PlainDate daysInMonth", () => {
  it.each<{ description: string; d: string; expected: number }>([
    { description: "Feb non-leap", d: "2026-02-01", expected: 28 },
    { description: "Feb leap", d: "2024-02-01", expected: 29 },
    { description: "30-day month (Apr)", d: "2026-04-15", expected: 30 },
    { description: "31-day month (Mar)", d: "2026-03-15", expected: 31 },
  ])("$description", ({ d, expected }) => {
    expect(date(d).daysInMonth).toBe(expected);
  });
});

describe("PlainDate toString roundtrip", () => {
  it("roundtrips through from/toString", () => {
    const iso = "2026-03-15";
    expect(T.PlainDate.from(date(iso).toString()).toString()).toBe(iso);
  });
});

describe("PlainDate equals", () => {
  it("returns true for same date", () => {
    expect(date("2026-03-15").equals(date("2026-03-15"))).toBe(true);
  });

  it("returns false for different date", () => {
    expect(date("2026-03-15").equals(date("2026-03-16"))).toBe(false);
  });
});

describe("PlainDateTime", () => {
  it("from string", () => {
    const dt = T.PlainDateTime.from("2026-03-15T10:30:45");
    expect(dt.year).toBe(2026);
    expect(dt.hour).toBe(10);
    expect(dt.minute).toBe(30);
    expect(dt.second).toBe(45);
  });

  it("from object", () => {
    const dt = T.PlainDateTime.from({
      year: 2026,
      month: 3,
      day: 15,
      hour: 10,
    });
    expect(dt.hour).toBe(10);
    expect(dt.minute).toBe(0);
  });

  it("toPlainDate", () => {
    const dt = T.PlainDateTime.from("2026-03-15T10:30:00");
    expect(dt.toPlainDate().toString()).toBe("2026-03-15");
  });
});

describe("PlainMonthDay", () => {
  it("from object", () => {
    const md = T.PlainMonthDay.from({ month: 7, day: 4 });
    expect(md.monthCode).toBe("M07");
    expect(md.day).toBe(4);
  });

  it("toPlainDate with year", () => {
    const md = T.PlainMonthDay.from({ month: 2, day: 28 });
    const pd = md.toPlainDate({ year: 2026 });
    expect(pd.toString()).toBe("2026-02-28");
  });
});

describe("PlainYearMonth", () => {
  it("from object", () => {
    const ym = T.PlainYearMonth.from({ year: 2026, month: 6 });
    expect(ym.year).toBe(2026);
    expect(ym.month).toBe(6);
  });

  it("toPlainDate with day", () => {
    const ym = T.PlainYearMonth.from({ year: 2026, month: 6 });
    expect(ym.toPlainDate({ day: 15 }).toString()).toBe("2026-06-15");
  });

  it("daysInMonth", () => {
    expect(T.PlainYearMonth.from({ year: 2026, month: 2 }).daysInMonth).toBe(28);
    expect(T.PlainYearMonth.from({ year: 2024, month: 2 }).daysInMonth).toBe(29);
  });
});

describe("ZonedDateTime", () => {
  it("extracts components in UTC", () => {
    const pdt = T.PlainDateTime.from("2026-03-15T10:30:00");
    const zdt = pdt.toZonedDateTime("UTC");
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(3);
    expect(zdt.day).toBe(15);
    expect(zdt.hour).toBe(10);
    expect(zdt.minute).toBe(30);
    expect(zdt.timeZoneId).toBe("UTC");
  });

  it("extracts components in a non-UTC timezone", () => {
    const pdt = T.PlainDateTime.from("2026-03-15T10:30:00");
    const zdt = pdt.toZonedDateTime("America/New_York");
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(3);
    expect(zdt.day).toBe(15);
    expect(zdt.hour).toBe(10);
    expect(zdt.timeZoneId).toBe("America/New_York");
  });

  it("toPlainDate roundtrip", () => {
    const pd = date("2026-06-20");
    const zdt = pd.toZonedDateTime("America/New_York");
    expect(zdt.toPlainDate().toString()).toBe("2026-06-20");
  });

  it("toPlainDateTime roundtrip", () => {
    const pdt = T.PlainDateTime.from("2026-03-15T14:30:00");
    const zdt = pdt.toZonedDateTime("UTC");
    const roundtrip = zdt.toPlainDateTime();
    expect(roundtrip.hour).toBe(14);
    expect(roundtrip.minute).toBe(30);
  });

  it("epochMilliseconds is valid", () => {
    const zdt = T.Now.zonedDateTimeISO("UTC");
    expect(typeof zdt.epochMilliseconds).toBe("number");
    expect(Math.abs(zdt.epochMilliseconds - Date.now())).toBeLessThan(1000);
  });
});

describe("Now", () => {
  it("timeZoneId returns a non-empty string", () => {
    const tz = T.Now.timeZoneId();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("zonedDateTimeISO returns current time", () => {
    const zdt = T.Now.zonedDateTimeISO("UTC");
    expect(zdt.year).toBeGreaterThan(2020);
  });

  it("plainDateISO returns today", () => {
    const pd = T.Now.plainDateISO();
    expect(pd.year).toBeGreaterThan(2020);
    expect(pd.month).toBeGreaterThanOrEqual(1);
    expect(pd.month).toBeLessThanOrEqual(12);
  });
});

describe("PlainDate → ZonedDateTime → PlainDate roundtrip", () => {
  it.each(["2026-01-01", "2026-06-15", "2026-12-31", "2024-02-29"])(
    "%s roundtrips through UTC",
    (iso) => {
      const pd = date(iso);
      const zdt = pd.toZonedDateTime("UTC");
      expect(zdt.toPlainDate().toString()).toBe(iso);
    },
  );

  it.each(["2026-01-01", "2026-06-15", "2026-12-31"])(
    "%s roundtrips through America/New_York",
    (iso) => {
      const pd = date(iso);
      const zdt = pd.toZonedDateTime("America/New_York");
      expect(zdt.toPlainDate().toString()).toBe(iso);
    },
  );
});
