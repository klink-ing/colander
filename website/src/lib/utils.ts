import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const allRoundedGroups = [
  "rounded",
  "rounded-s",
  "rounded-e",
  "rounded-t",
  "rounded-r",
  "rounded-b",
  "rounded-l",
  "rounded-ss",
  "rounded-se",
  "rounded-es",
  "rounded-ee",
  "rounded-tl",
  "rounded-tr",
  "rounded-br",
  "rounded-bl",
] as const;

export const twMerge = extendTailwindMerge<"type-style" | "squircle" | "squircle-amt">({
  extend: {
    classGroups: {
      "type-style": [{ type: [() => true] }],
      // All squircle radius utilities in one group — since corner-shape
      // is global, any squircle class is incompatible with any rounded class.
      squircle: [
        { squircle: [() => true] },
        { "squircle-t": [() => true] },
        { "squircle-r": [() => true] },
        { "squircle-b": [() => true] },
        { "squircle-l": [() => true] },
        { "squircle-tl": [() => true] },
        { "squircle-tr": [() => true] },
        { "squircle-br": [() => true] },
        { "squircle-bl": [() => true] },
      ],
      "squircle-amt": [{ "squircle-amt": [() => true] }],
      "ring-w": ["ring-w-focus"],
    },
    conflictingClassGroups: {
      "type-style": [
        "font-size",
        "font-family",
        "leading",
        "tracking",
        "font-weight",
        "font-style",
        "text-transform",
      ],
      // Any squircle clears all rounded (corner-shape is incompatible)
      squircle: [...allRoundedGroups, "squircle-amt"],
      // Any rounded clears all squircle + squircle-amt
      ...Object.fromEntries(allRoundedGroups.map((g) => [g, ["squircle", "squircle-amt"]])),
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
