/**
 * Minimal, dependency-free `Temporal` engine for the calendar's **internal**
 * date math. {@link resolveTemporal} selects it automatically — with no
 * `@js-temporal/polyfill` dependency — when the host lacks native `Temporal`
 * and the caller drives the calendar with a non-`Temporal` value format
 * (`object`, `Date`), since those values never expose `Temporal` objects. It
 * can also be passed explicitly via the `temporal` prop. For a `Temporal`
 * value format with no native/provided `Temporal`, resolution throws rather
 * than substitute the shim (the caller wants real `Temporal` objects).
 *
 * **ISO 8601 / Gregorian only.** It implements just enough of the `Temporal`
 * surface for the calendar to operate (`PlainDate`, `PlainDateTime`,
 * `PlainMonthDay`, `PlainYearMonth`, `Now`) using Gregorian arithmetic.
 * `toLocaleString` formats via the host `Intl`, so display still localizes to
 * the locale's calendar (e.g. Buddhist for `th-TH`), but the shim performs
 * **no non-Gregorian calendar math** — all field values and arithmetic are
 * Gregorian.
 *
 * If you work with `Temporal` objects directly, or need non-Gregorian calendar
 * math (Buddhist, Hebrew, Islamic, …), provide native `Temporal` or
 * `@js-temporal/polyfill` via the `temporal` prop instead.
 */
import type { TemporalNamespace } from "./types";

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function toUTC(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

function isoWeekday(utcDate: Date): number {
  const dow = utcDate.getUTCDay();
  return dow === 0 ? 7 : dow;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

function parseDateISO(str: string): {
  year: number;
  month: number;
  day: number;
} {
  const [datePart] = str.split("T");
  const [y, m, d] = datePart?.split("-").map(Number) ?? [];
  if (y === undefined || m === undefined || d === undefined) {
    throw new RangeError(`Invalid ISO date string: ${str}`);
  }
  return { year: y, month: m, day: d };
}

function parseDateTimeISO(str: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const [datePart, timePart] = str.split("T");
  const [y, m, d] = datePart?.split("-").map(Number) ?? [];
  if (y === undefined || m === undefined || d === undefined) {
    throw new RangeError(`Invalid ISO date-time string: ${str}`);
  }
  if (!timePart)
    return { year: y, month: m, day: d, hour: 0, minute: 0, second: 0 };
  const [h, min, s] = timePart.split(":").map(Number);
  return {
    year: y,
    month: m,
    day: d,
    hour: h || 0,
    minute: min || 0,
    second: s || 0,
  };
}

// Cache Intl.DateTimeFormat instances per timezone
const dtfCache = new Map<string, Intl.DateTimeFormat>();

function getDTF(tz: string): Intl.DateTimeFormat {
  let dtf = dtfCache.get(tz);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    dtfCache.set(tz, dtf);
  }
  return dtf;
}

interface TzParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function extractTzParts(epochMs: number, tz: string): TzParts {
  const dtf = getDTF(tz);
  const parts = dtf.formatToParts(new Date(epochMs));
  const vals: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      vals[p.type] = Number(p.value);
    }
  }
  const { year, month, day, hour, minute, second } = vals;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    throw new RangeError(`Invalid time zone: ${tz}`);
  }
  return {
    year,
    month,
    day,
    hour: hour === 24 ? 0 : hour,
    minute,
    second,
  };
}

function wallToEpoch(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  s: number,
  tz: string,
): number {
  const utcGuess = Date.UTC(y, m - 1, d, h, min, s);
  const inTz = extractTzParts(utcGuess, tz);
  const wallOfGuess = Date.UTC(
    inTz.year,
    inTz.month - 1,
    inTz.day,
    inTz.hour,
    inTz.minute,
    inTz.second,
  );
  return utcGuess - (wallOfGuess - utcGuess);
}

// ---------------------------------------------------------------------------
// MiniPlainDate
// ---------------------------------------------------------------------------

class MiniPlainDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;

  constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  get dayOfWeek(): number {
    return isoWeekday(new Date(toUTC(this.year, this.month, this.day)));
  }

  get daysInWeek(): number {
    return 7;
  }

  get daysInMonth(): number {
    return daysInMonth(this.year, this.month);
  }

  get monthCode(): string {
    return `M${pad2(this.month)}`;
  }

  add(dur: {
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
  }): MiniPlainDate {
    let y = this.year + (dur.years || 0);
    let m = this.month + (dur.months || 0);

    // Resolve month overflow/underflow
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    while (m < 1) {
      m += 12;
      y -= 1;
    }

    // Clamp day to valid range for new month
    const d = Math.min(this.day, daysInMonth(y, m));

    // Add days and weeks via epoch arithmetic
    const totalDays = (dur.days || 0) + (dur.weeks || 0) * 7;
    if (totalDays === 0) return new MiniPlainDate(y, m, d);

    const epoch = toUTC(y, m, d) + totalDays * 86400000;
    const ud = new Date(epoch);
    return new MiniPlainDate(
      ud.getUTCFullYear(),
      ud.getUTCMonth() + 1,
      ud.getUTCDate(),
    );
  }

  subtract(dur: {
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
  }): MiniPlainDate {
    return this.add({
      ...(dur.days && { days: -dur.days }),
      ...(dur.weeks && { weeks: -dur.weeks }),
      ...(dur.months && { months: -dur.months }),
      ...(dur.years && { years: -dur.years }),
    });
  }

  since(other: MiniPlainDate, _opts?: any): { days: number } {
    const thisUTC = toUTC(this.year, this.month, this.day);
    const otherUTC = toUTC(other.year, other.month, other.day);
    return { days: Math.round((thisUTC - otherUTC) / 86400000) };
  }

  until(other: MiniPlainDate, _opts?: any): { days: number } {
    const thisUTC = toUTC(this.year, this.month, this.day);
    const otherUTC = toUTC(other.year, other.month, other.day);
    return { days: Math.round((otherUTC - thisUTC) / 86400000) };
  }

  equals(other: MiniPlainDate): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    );
  }

  toString(): string {
    return `${String(this.year).padStart(4, "0")}-${pad2(this.month)}-${pad2(this.day)}`;
  }

  toZonedDateTime(tz: string | { timeZone: string }): MiniZonedDateTime {
    const tzId = typeof tz === "string" ? tz : tz.timeZone;
    return this.toPlainDateTime().toZonedDateTime(tzId);
  }

  toPlainDateTime(timeLike?: {
    hour?: number;
    minute?: number;
    second?: number;
  }): MiniPlainDateTime {
    return new MiniPlainDateTime(
      this.year,
      this.month,
      this.day,
      timeLike?.hour ?? 0,
      timeLike?.minute ?? 0,
      timeLike?.second ?? 0,
    );
  }

  toPlainMonthDay(): MiniPlainMonthDay {
    return new MiniPlainMonthDay(this.month, this.day);
  }

  toPlainYearMonth(): MiniPlainYearMonth {
    return new MiniPlainYearMonth(this.year, this.month);
  }

  toLocaleString(
    locale?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return new Date(toUTC(this.year, this.month, this.day)).toLocaleDateString(
      locale,
      {
        timeZone: "UTC",
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// MiniPlainDateTime
// ---------------------------------------------------------------------------

class MiniPlainDateTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;

  constructor(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
  ) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;
  }

  get dayOfWeek(): number {
    return isoWeekday(new Date(toUTC(this.year, this.month, this.day)));
  }

  get daysInMonth(): number {
    return daysInMonth(this.year, this.month);
  }

  toZonedDateTime(tz: string | { timeZone: string }): MiniZonedDateTime {
    const tzId = typeof tz === "string" ? tz : tz.timeZone;
    const epoch = wallToEpoch(
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
      tzId,
    );
    return new MiniZonedDateTime(epoch, tzId);
  }

  toPlainDate(): MiniPlainDate {
    return new MiniPlainDate(this.year, this.month, this.day);
  }

  toString(): string {
    return `${String(this.year).padStart(4, "0")}-${pad2(this.month)}-${pad2(this.day)}T${pad2(this.hour)}:${pad2(this.minute)}:${pad2(this.second)}`;
  }
}

// ---------------------------------------------------------------------------
// MiniPlainMonthDay
// ---------------------------------------------------------------------------

class MiniPlainMonthDay {
  readonly monthCode: string;
  readonly month: number;
  readonly day: number;

  constructor(month: number, day: number) {
    this.month = month;
    this.day = day;
    this.monthCode = `M${pad2(month)}`;
  }

  toPlainDate(fields: { year: number }): MiniPlainDate {
    return new MiniPlainDate(fields.year, this.month, this.day);
  }

  equals(other: MiniPlainMonthDay): boolean {
    return this.month === other.month && this.day === other.day;
  }

  toString(): string {
    return `${pad2(this.month)}-${pad2(this.day)}`;
  }
}

// ---------------------------------------------------------------------------
// MiniPlainYearMonth
// ---------------------------------------------------------------------------

class MiniPlainYearMonth {
  readonly year: number;
  readonly month: number;

  constructor(year: number, month: number) {
    this.year = year;
    this.month = month;
  }

  get monthCode(): string {
    return `M${pad2(this.month)}`;
  }

  get daysInMonth(): number {
    return daysInMonth(this.year, this.month);
  }

  toPlainDate(fields: { day: number }): MiniPlainDate {
    return new MiniPlainDate(this.year, this.month, fields.day);
  }

  add(dur: { months?: number; years?: number }): MiniPlainYearMonth {
    let y = this.year + (dur.years || 0);
    let m = this.month + (dur.months || 0);
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    return new MiniPlainYearMonth(y, m);
  }

  subtract(dur: { months?: number; years?: number }): MiniPlainYearMonth {
    return this.add({
      ...(dur.months && { months: -dur.months }),
      ...(dur.years && { years: -dur.years }),
    });
  }

  equals(other: MiniPlainYearMonth): boolean {
    return this.year === other.year && this.month === other.month;
  }

  toString(): string {
    return `${String(this.year).padStart(4, "0")}-${pad2(this.month)}`;
  }
}

// ---------------------------------------------------------------------------
// MiniZonedDateTime
// ---------------------------------------------------------------------------

class MiniZonedDateTime {
  readonly epochMilliseconds: number;
  readonly timeZoneId: string;
  private _parts?: TzParts;

  constructor(epochMs: number, timeZoneId: string) {
    this.epochMilliseconds = epochMs;
    this.timeZoneId = timeZoneId;
  }

  private get parts(): TzParts {
    if (!this._parts) {
      this._parts = extractTzParts(this.epochMilliseconds, this.timeZoneId);
    }
    return this._parts;
  }

  get year(): number {
    return this.parts.year;
  }
  get month(): number {
    return this.parts.month;
  }
  get day(): number {
    return this.parts.day;
  }
  get hour(): number {
    return this.parts.hour;
  }
  get minute(): number {
    return this.parts.minute;
  }
  get second(): number {
    return this.parts.second;
  }

  get dayOfWeek(): number {
    return isoWeekday(new Date(toUTC(this.year, this.month, this.day)));
  }

  toPlainDate(): MiniPlainDate {
    return new MiniPlainDate(this.year, this.month, this.day);
  }

  toPlainDateTime(): MiniPlainDateTime {
    return new MiniPlainDateTime(
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
    );
  }

  toPlainTime(): { hour: number; minute: number; second: number } {
    return { hour: this.hour, minute: this.minute, second: this.second };
  }

  toPlainYearMonth(): MiniPlainYearMonth {
    return new MiniPlainYearMonth(this.year, this.month);
  }

  toString(): string {
    return `${String(this.year).padStart(4, "0")}-${pad2(this.month)}-${pad2(this.day)}T${pad2(this.hour)}:${pad2(this.minute)}:${pad2(this.second)}[${this.timeZoneId}]`;
  }
}

// ---------------------------------------------------------------------------
// Static constructors
// ---------------------------------------------------------------------------

const PlainDate = {
  from(item: any, options?: { overflow?: string }): MiniPlainDate {
    if (typeof item === "string") {
      const { year, month, day } = parseDateISO(item);
      if (options?.overflow === "constrain") {
        return new MiniPlainDate(
          year,
          month,
          clamp(day, 1, daysInMonth(year, month)),
        );
      }
      return new MiniPlainDate(year, month, day);
    }
    const year = item.year;
    const month = item.month;
    let day = item.day;
    if (options?.overflow === "constrain") {
      day = clamp(day, 1, daysInMonth(year, month));
    }
    return new MiniPlainDate(year, month, day);
  },

  compare(a: MiniPlainDate, b: MiniPlainDate): number {
    if (a.year !== b.year) return Math.sign(a.year - b.year);
    if (a.month !== b.month) return Math.sign(a.month - b.month);
    if (a.day !== b.day) return Math.sign(a.day - b.day);
    return 0;
  },
};

const PlainDateTime = {
  from(item: any, _options?: { overflow?: string }): MiniPlainDateTime {
    if (typeof item === "string") {
      const { year, month, day, hour, minute, second } = parseDateTimeISO(item);
      return new MiniPlainDateTime(year, month, day, hour, minute, second);
    }
    return new MiniPlainDateTime(
      item.year,
      item.month,
      item.day,
      item.hour ?? 0,
      item.minute ?? 0,
      item.second ?? 0,
    );
  },
};

const PlainMonthDay = {
  from(item: any): MiniPlainMonthDay {
    if (typeof item === "string") {
      // "MM-DD" or "YYYY-MM-DD" — take last two numeric segments
      const [first, second, third] = item.split("-").map(Number);
      if (first === undefined || second === undefined) {
        throw new RangeError(`Invalid ISO month-day string: ${item}`);
      }
      if (third !== undefined) return new MiniPlainMonthDay(second, third);
      return new MiniPlainMonthDay(first, second);
    }
    const month =
      item.month ??
      (item.monthCode ? Number.parseInt(item.monthCode.slice(1), 10) : 1);
    return new MiniPlainMonthDay(month, item.day);
  },
};

const PlainYearMonth = {
  from(item: any): MiniPlainYearMonth {
    if (typeof item === "string") {
      const [y, m] = item.split("-").map(Number);
      if (y === undefined || m === undefined) {
        throw new RangeError(`Invalid ISO year-month string: ${item}`);
      }
      return new MiniPlainYearMonth(y, m);
    }
    return new MiniPlainYearMonth(item.year, item.month);
  },

  compare(a: MiniPlainYearMonth, b: MiniPlainYearMonth): number {
    if (a.year !== b.year) return Math.sign(a.year - b.year);
    if (a.month !== b.month) return Math.sign(a.month - b.month);
    return 0;
  },
};

// ---------------------------------------------------------------------------
// Now
// ---------------------------------------------------------------------------

const Now = {
  timeZoneId(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  zonedDateTimeISO(tz?: string): MiniZonedDateTime {
    return new MiniZonedDateTime(Date.now(), tz ?? Now.timeZoneId());
  },

  plainDateISO(): MiniPlainDate {
    const tz = Now.timeZoneId();
    const parts = extractTzParts(Date.now(), tz);
    return new MiniPlainDate(parts.year, parts.month, parts.day);
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const Temporal = {
  Now,
  PlainDate,
  PlainDateTime,
  PlainMonthDay,
  PlainYearMonth,
} as unknown as TemporalNamespace;
