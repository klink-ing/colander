import type { FluidConfig } from "../plugins/fluid.ts";

export default {
  // Default breakpoint range (as bp unit numbers)
  minBp: 4.5,
  maxBp: 13,

  // Values in rem
  rem: {
    "display-100": { min: 2, max: 3 },
    "display-200": { min: 2.5, max: 5 },
    "display-300": { min: 4, max: 8, maxBp: 10 },

    "heading-100": { min: 1.0625, max: 1.25 },
    "heading-200": { min: 1.35, max: 2.25 },
    "heading-300": { min: 1.5, max: 2.75 },
  },

  // Values in Tailwind spacing units (1 = 0.25rem)
  spacing: {
    'page-mx': { min: 2, max: 20, minBp: 3 },
  },
} satisfies FluidConfig;
