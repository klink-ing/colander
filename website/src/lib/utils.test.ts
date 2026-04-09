import { describe, it, expect } from "vitest";

import { cn } from "./utils";

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
      input: "type-body-200 text-foreground-vivid type-body-100",
      expected: "text-foreground-vivid type-body-100",
    },
  ] as const;

  it.each(cases)("$title", ({ input, expected }) => {
    expect(cn(input)).toBe(expected);
  });
});

describe("cn() squircle / rounded conflict resolution", () => {
  describe("squircle clears all rounded", () => {
    const cases = [
      {
        description: "squircle-* clears preceding rounded-*",
        input: "rounded-lg squircle-xl",
        expected: "squircle-xl",
      },
      {
        description: "squircle-* clears preceding per-corner rounded",
        input: "rounded-tl-lg squircle-xl",
        expected: "squircle-xl",
      },
      {
        description: "squircle-* clears preceding per-side rounded",
        input: "rounded-t-lg squircle-xl",
        expected: "squircle-xl",
      },
      {
        description: "squircle per-corner clears preceding rounded-*",
        input: "rounded-lg squircle-tl-xl",
        expected: "squircle-tl-xl",
      },
      {
        description: "squircle per-corner clears preceding per-corner rounded",
        input: "rounded-br-lg squircle-tl-xl",
        expected: "squircle-tl-xl",
      },
      {
        description:
          "squircle per-side clears preceding different-side rounded",
        input: "rounded-b-lg squircle-t-xl",
        expected: "squircle-t-xl",
      },
      {
        description: "squircle clears multiple preceding rounded classes",
        input: "rounded-tl-lg rounded-br-md squircle-xl",
        expected: "squircle-xl",
      },
    ] as const;

    it.each(cases)("$description", ({ input, expected }) => {
      expect(cn(input)).toBe(expected);
    });
  });

  describe("rounded clears all squircle", () => {
    const cases = [
      {
        description: "rounded-* clears preceding squircle-*",
        input: "squircle-xl rounded-lg",
        expected: "rounded-lg",
      },
      {
        description: "rounded-* clears preceding per-corner squircle",
        input: "squircle-tl-xl rounded-lg",
        expected: "rounded-lg",
      },
      {
        description: "rounded per-corner clears preceding squircle-*",
        input: "squircle-xl rounded-tl-lg",
        expected: "rounded-tl-lg",
      },
      {
        description:
          "rounded per-corner clears preceding different-corner squircle",
        input: "squircle-br-xl rounded-tl-lg",
        expected: "rounded-tl-lg",
      },
      {
        description: "rounded clears multiple preceding squircle classes",
        input: "squircle-tl-xl squircle-br-md rounded-lg",
        expected: "rounded-lg",
      },
    ] as const;

    it.each(cases)("$description", ({ input, expected }) => {
      expect(cn(input)).toBe(expected);
    });
  });

  describe("squircle-amt interactions", () => {
    const cases = [
      {
        description: "rounded-* clears preceding squircle-amt",
        input: "squircle-amt-[2] rounded-lg",
        expected: "rounded-lg",
      },
      {
        description: "squircle-amt does NOT clear preceding rounded-*",
        input: "rounded-lg squircle-amt-[2]",
        expected: "rounded-lg squircle-amt-[2]",
      },
      {
        description: "squircle-* clears preceding squircle-amt",
        input: "squircle-amt-[2] squircle-lg",
        expected: "squircle-lg",
      },
      {
        description: "squircle-amt does NOT clear preceding squircle-*",
        input: "squircle-lg squircle-amt-[2]",
        expected: "squircle-lg squircle-amt-[2]",
      },
      {
        description: "squircle-amt + squircle kept, then rounded clears both",
        input: "squircle-amt-[2] squircle-tl-xl rounded-lg",
        expected: "rounded-lg",
      },
      {
        description:
          "rounded then squircle-amt then squircle — squircle clears both rounded and squircle-amt",
        input: "rounded-lg squircle-amt-[2] squircle-tl-xl",
        expected: "squircle-tl-xl",
      },
    ] as const;

    it.each(cases)("$description", ({ input, expected }) => {
      expect(cn(input)).toBe(expected);
    });
  });

  describe("squircle self-conflicts", () => {
    const cases = [
      {
        description: "later squircle-* overrides earlier squircle-*",
        input: "squircle-lg squircle-xl",
        expected: "squircle-xl",
      },
      {
        description:
          "later per-corner squircle overrides earlier different-corner",
        input: "squircle-tl-lg squircle-br-xl",
        expected: "squircle-br-xl",
      },
      {
        description: "squircle-* overrides preceding per-corner squircle",
        input: "squircle-tl-lg squircle-xl",
        expected: "squircle-xl",
      },
      {
        description: "per-corner squircle overrides preceding squircle-*",
        input: "squircle-xl squircle-tl-lg",
        expected: "squircle-tl-lg",
      },
    ] as const;

    it.each(cases)("$description", ({ input, expected }) => {
      expect(cn(input)).toBe(expected);
    });
  });

  describe("non-conflicting classes preserved", () => {
    const cases = [
      {
        description: "squircle preserves non-border-radius utilities",
        input: "bg-red-500 squircle-lg text-white",
        expected: "bg-red-500 squircle-lg text-white",
      },
      {
        description: "rounded preserves non-border-radius utilities",
        input: "bg-red-500 rounded-lg text-white",
        expected: "bg-red-500 rounded-lg text-white",
      },
    ] as const;

    it.each(cases)("$description", ({ input, expected }) => {
      expect(cn(input)).toBe(expected);
    });
  });
});
