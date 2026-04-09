import { Temporal as FullTemporal } from "@js-temporal/polyfill";
import { Temporal as MiniTemporal } from "./temporal-polyfill";
import type { TemporalNamespace } from "./types";

export const temporalVariants: { name: string; T: TemporalNamespace }[] = [
  {
    name: "full polyfill",
    T: {
      Now: FullTemporal.Now,
      PlainDate: FullTemporal.PlainDate,
      PlainDateTime: FullTemporal.PlainDateTime,
      PlainMonthDay: FullTemporal.PlainMonthDay,
      PlainYearMonth: FullTemporal.PlainYearMonth,
    },
  },
  { name: "mini polyfill", T: MiniTemporal },
];
