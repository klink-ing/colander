import type { Temporal } from "@js-temporal/polyfill";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MonthRef, MonthWindowPolicy } from "./month-window";
import type { TemporalNamespace } from "./types";
import { focusedDateForMonth } from "./utils";

export interface UseMonthNavigationInput {
  /** Controlled first visible month. */
  month: MonthRef | undefined;
  /** Initial first visible month when uncontrolled. */
  defaultMonth: MonthRef | undefined;
  /** Date the view opens on when neither `month` nor `defaultMonth` is given. */
  initialAnchor: () => Temporal.PlainDate;
  onMonthChange: ((month: Temporal.PlainYearMonth) => void) | undefined;
  policy: MonthWindowPolicy;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: Dispatch<SetStateAction<Temporal.PlainDate>>;
  T: TemporalNamespace;
}

export interface MonthNavigation {
  /** The first visible month. */
  currentMonth: MonthRef;
  /** The first visible month as an ISO `PlainYearMonth`. */
  viewingYearMonth: Temporal.PlainYearMonth;
  goNextMonth: () => void;
  goPrevMonth: () => void;
}

/**
 * Owns which month the view shows, in both controlled and uncontrolled mode:
 * the month state, the Prev/Next steps, and syncing the window with focus.
 *
 * `onMonthChange` fires exactly once per move: from the effect below when
 * uncontrolled, and from the step or the focus-sync effect when controlled.
 */
export function useMonthNavigation(
  input: UseMonthNavigationInput,
): MonthNavigation {
  const {
    month,
    defaultMonth,
    initialAnchor,
    onMonthChange,
    policy,
    focusedDate,
    setFocusedDate,
    T,
  } = input;

  const isControlled = month !== undefined;

  const [internalMonth, setInternalMonth] = useState<MonthRef>(() => {
    if (month) return { year: month.year, month: month.month };
    if (defaultMonth)
      return { year: defaultMonth.year, month: defaultMonth.month };
    const anchor = initialAnchor();
    return { year: anchor.year, month: anchor.month };
  });

  const year = isControlled ? month.year : internalMonth.year;
  const monthNumber = isControlled ? month.month : internalMonth.month;
  const currentMonth = useMemo<MonthRef>(
    () => ({ year, month: monthNumber }),
    [year, monthNumber],
  );

  // ISO — the locale calendar only affects display, not this value.
  const viewingYearMonth = useMemo(
    () => T.PlainYearMonth.from({ year, month: monthNumber }),
    [year, monthNumber, T],
  );

  // Always-current ref so callbacks/effects don't re-subscribe on every
  // onMonthChange identity change.
  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;

  // Request the parent move the view to `{year, month}` (controlled mode).
  // Built in ISO — `year`/`month` are ISO numbers, and the locale calendar
  // only affects display (see MonthYearString). Passing `calendar` here would
  // reinterpret the ISO numbers as locale-calendar fields (e.g. Buddhist),
  // shifting the value by centuries.
  const notifyMonth = useCallback(
    (target: MonthRef) => {
      onMonthChangeRef.current?.(T.PlainYearMonth.from(target));
    },
    [T],
  );

  // Button navigation in controlled mode notifies the parent directly, then
  // moves focus into the target month. This ref holds that focus value so the
  // focus-sync effect skips re-notifying for it. Keyed by the value (not a
  // one-shot flag) so it can't strand and suppress a later keyboard crossing
  // if the button's focus move is a no-op or the parent ignores the change.
  const skipFocusSyncForRef = useRef<Temporal.PlainDate | null>(null);
  const prevFocusedRef = useRef(focusedDate);

  // Clear a stale skip target whenever the parent actually moves the view.
  useEffect(() => {
    skipFocusSyncForRef.current = null;
  }, [month?.year, month?.month]);

  // Sync month when the focused date crosses a month boundary. Uncontrolled:
  // shift internal state. Controlled: ask the parent to move the view, but
  // only when focus actually moved out of the visible window (keyboard nav) —
  // never as an echo of an external `month` update or a button click.
  useEffect(() => {
    const prevFocused = prevFocusedRef.current;
    prevFocusedRef.current = focusedDate;
    const target = { year: focusedDate.year, month: focusedDate.month };
    if (isControlled) {
      if (skipFocusSyncForRef.current === focusedDate) {
        skipFocusSyncForRef.current = null;
        return;
      }
      if (prevFocused === focusedDate) return;
      if (policy.isVisible(currentMonth, target)) return;
      // Emit the minimally-shifted first-visible month (what the parent binds
      // to `month`), not the focused month — so a controlled window scrolls by
      // the minimum, matching uncontrolled mode and the nav buttons.
      notifyMonth(policy.reveal(currentMonth, target));
      return;
    }
    setInternalMonth((prev) => {
      const next = policy.reveal(prev, target);
      if (next.year === prev.year && next.month === prev.month) return prev;
      return next;
    });
  }, [focusedDate, isControlled, policy, currentMonth, notifyMonth]);

  // Fire onMonthChange when uncontrolled navigation moves the view (not on
  // mount). In controlled mode the parent owns `month`, so notification flows
  // from the steps and the focus-sync effect instead; firing here would just
  // echo the parent's own update back to it.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (isControlled) return;
    onMonthChangeRef.current?.(viewingYearMonth);
  }, [viewingYearMonth, isControlled]);

  const go = useCallback(
    (direction: "prev" | "next") => {
      if (isControlled) {
        const step = policy.step(month, direction);
        if (step.blocked) return;
        // Notify the parent directly; the follow-on focus move is suppressed in
        // the focus-sync effect (keyed on the value) so onMonthChange fires once.
        const nextFocus = focusedDateForMonth(
          focusedDate,
          step.start,
          step.firstDay,
        );
        skipFocusSyncForRef.current = nextFocus;
        notifyMonth(step.start);
        setFocusedDate(nextFocus);
        return;
      }
      setInternalMonth((m) => {
        const step = policy.step(m, direction);
        if (step.blocked) return m;
        setFocusedDate((prev) =>
          focusedDateForMonth(prev, step.start, step.firstDay),
        );
        return step.start;
      });
    },
    [isControlled, month, policy, notifyMonth, focusedDate, setFocusedDate],
  );

  const goNextMonth = useCallback(() => go("next"), [go]);
  const goPrevMonth = useCallback(() => go("prev"), [go]);

  return { currentMonth, viewingYearMonth, goNextMonth, goPrevMonth };
}
