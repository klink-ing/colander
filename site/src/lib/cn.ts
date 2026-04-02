import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Every type-* utility sets the same seven CSS properties — font-family,
 * font-size, line-height, letter-spacing, font-weight, font-style, and
 * text-transform — so switching between any two fully resets all
 * typography with no property leaks.
 *
 * Conflicts are bidirectional: a type-* class removes any preceding
 * individual utility (e.g. `text-sm type-body-200` → `type-body-200`),
 * and an individual utility removes a preceding type-* class
 * (e.g. `type-body-200 font-bold` → `font-bold`).
 */
export const twMerge = extendTailwindMerge<"type-style">({
  extend: {
    classGroups: {
      "type-style": [{ type: () => true }],
    },
    conflictingClassGroups: {
      // type-* creates conflicts and therefore removes preceding
      // Tailwind typography utilities when both are present.
      "type-style": [
        "font-size",
        "font-family",
        "leading",
        "tracking",
        "font-weight",
        "font-style",
        "text-transform",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  // Preserve caller order. We rely on asymmetric `conflictingClassGroups`
  // so that later utilities override earlier ones when they overlap.
  return twMerge(clsx(inputs));
}
