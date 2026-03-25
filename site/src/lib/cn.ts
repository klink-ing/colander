import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * All type-* utility names. Every type-* utility sets the same seven
 * CSS properties — font-family, font-size, line-height, letter-spacing,
 * font-weight, font-style, and text-transform — so switching between
 * any two fully resets all typography with no property leaks.
 *
 * Conflicts are bidirectional: a type-* class removes any preceding
 * individual utility (e.g. `text-sm type-body-200` → `type-body-200`),
 * and an individual utility removes a preceding type-* class
 * (e.g. `type-body-200 font-bold` → `font-bold`).
 */
const typeClasses = [
  'type-display-100',
  'type-display-200',
  'type-heading-100',
  'type-heading-200',
  'type-heading-300',
  'type-body-100',
  'type-body-100-bold',
  'type-body-100-italic',
  'type-body-200',
  'type-body-200-bold',
  'type-body-200-italic',
  'type-label-100',
  'type-label-200',
  'type-code-100',
  'type-code-200',
] as const

export const twMerge = extendTailwindMerge<'type-style'>({
  extend: {
    classGroups: {
      'type-style': [...typeClasses],
    },
    conflictingClassGroups: {
      // type-* creates conflicts and therefore removes preceding
      // Tailwind typography utilities when both are present.
      'type-style': [
        'font-size',
        'font-family',
        'leading',
        'tracking',
        'font-weight',
        'font-style',
        'text-transform',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  // Preserve caller order. We rely on asymmetric `conflictingClassGroups`
  // so that later utilities override earlier ones when they overlap.
  return twMerge(clsx(inputs))
}
