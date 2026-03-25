import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * All type-* utility names. Each one sets font-family, font-size,
 * line-height, and letter-spacing (and possibly font-weight, font-style,
 * text-transform), so they must conflict with each other AND with the
 * individual Tailwind utilities that set those same properties.
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
      // type-* wins over individual typography utilities
      'type-style': [
        'font-size',
        'font-family',
        'leading',
        'tracking',
        'font-weight',
        'font-style',
      ],
      // individual typography utilities win over type-*
      'font-size': ['type-style'],
      'font-family': ['type-style'],
      leading: ['type-style'],
      tracking: ['type-style'],
      'font-weight': ['type-style'],
      'font-style': ['type-style'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
