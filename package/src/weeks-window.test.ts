import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vite-plus/test";
import { createWeekWindowPolicy } from "./weeks-window";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

describe("createWeekWindowPolicy", () => {
  const policy = createWeekWindowPolicy({
    weekCount: 4,
    behavior: "snap",
    min: pd("2026-03-01"),
    max: pd("2026-04-30"),
    weekStartDay: 0,
    T,
  });

  it("resolve snaps an overshooting first week back to the max edge", () => {
    const { firstWeek, weekCount } = policy.resolve(pd("2026-05-10"));
    expect({ firstWeek: firstWeek.toString(), weekCount }).toEqual({
      firstWeek: "2026-04-05",
      weekCount: 4,
    });
  });

  it.each([
    {
      description:
        "next is blocked once the window already sits at the max edge",
      from: "2026-04-05",
      direction: 1 as const,
      expected: false,
    },
    {
      description: "prev is allowed away from the max edge",
      from: "2026-04-05",
      direction: -1 as const,
      expected: true,
    },
  ])("canShift: $description", ({ from, direction, expected }) => {
    expect(policy.canShift(pd(from), direction)).toBe(expected);
  });
});
