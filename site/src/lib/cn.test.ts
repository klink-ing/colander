import { describe, it, expect } from "vitest";

import { cn } from "./cn";

describe("cn() typography composition with type-* utilities", () => {
  const cases = [
    {
      title:
        "keeps type-* and removes preceding conflicting typography utilities",
      input: "font-bold type-body-200",
      expected: "type-body-200",
    },
    {
      title:
        "keeps type-* and allows later conflicting typography utilities to override",
      input: "type-body-200 font-bold",
      expected: "type-body-200 font-bold",
    },
    {
      title:
        "removes preceding font-size/leading utilities when type-* comes later",
      input: "text-sm type-body-200",
      expected: "type-body-200",
    },
    {
      title:
        "allows later font-size/leading utilities to override but keeps type-*",
      input: "type-body-200 text-sm",
      expected: "type-body-200 text-sm",
    },
    {
      title: "removes preceding font-style utilities when type-* comes later",
      input: "italic type-body-200",
      expected: "type-body-200",
    },
    {
      title: "allows later font-style utilities to override but keeps type-*",
      input: "type-body-200 italic",
      expected: "type-body-200 italic",
    },
    {
      title:
        "removes preceding text-transform utilities when type-* comes later",
      input: "uppercase type-body-200",
      expected: "type-body-200",
    },
    {
      title:
        "allows later text-transform utilities to override but keeps type-*",
      input: "type-body-200 uppercase",
      expected: "type-body-200 uppercase",
    },
    {
      title: "removes preceding tracking utilities when type-* comes later",
      input: "tracking-wide type-body-200",
      expected: "type-body-200",
    },
    {
      title: "allows later tracking utilities to override but keeps type-*",
      input: "type-body-200 tracking-wide",
      expected: "type-body-200 tracking-wide",
    },

    // Utility -> type-* -> utility boundary cases.
    {
      title: "removes a preceding conflicting utility when type-* comes next",
      input: "font-bold type-body-200 italic",
      expected: "type-body-200 italic",
    },
    {
      title: "keeps non-conflicting utilities across type-* boundary",
      input: "text-muted-foreground type-body-200 font-bold",
      expected: "text-muted-foreground type-body-200 font-bold",
    },

    // type-* -> utility -> type-* sandwich cases.
    {
      title: "removes conflicting utility sandwiched between type-* classes",
      input: "type-body-200 font-bold type-body-100",
      expected: "type-body-100",
    },
    {
      title: "keeps non-conflicting utilities between type-* classes",
      input: "type-body-200 text-accent type-body-100",
      expected: "text-accent type-body-100",
    },
  ] as const;

  it.each(cases)("$title", ({ input, expected }) => {
    expect(cn(input)).toBe(expected);
  });
});
