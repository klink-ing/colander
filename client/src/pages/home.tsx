import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { createDatePicker } from "@/components/ui/date-picker";
import type { DatePickerValueForFormat } from "@/components/ui/date-picker";
import { StyledDatePicker } from "@/components/styled-date-picker";
import { RenderPropDatePicker } from "@/components/render-prop-date-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ZonedDatePicker = createDatePicker("ZonedDateTime");

type ZonedValue = DatePickerValueForFormat<"ZonedDateTime">;

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<ZonedValue | undefined>();
  const [selectedDate2, setSelectedDate2] = useState<ZonedValue | undefined>();

  const formatDisplay = (val: ZonedValue | undefined) =>
    val
      ? `Selected: ${new Date(val.value.epochMilliseconds).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${val.value.timeZoneId})`
      : "Pick a date below";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 gap-6 flex-wrap">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle data-testid="text-title">Styled DatePicker</CardTitle>
          <CardDescription data-testid="text-selected-date">
            {formatDisplay(selectedDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <StyledDatePicker
            components={ZonedDatePicker}
            value={selectedDate}
            onValueChange={setSelectedDate}
          />
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle data-testid="text-title-render">Render Prop DatePicker</CardTitle>
          <CardDescription data-testid="text-selected-date-render">
            {formatDisplay(selectedDate2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <RenderPropDatePicker
            components={ZonedDatePicker}
            value={selectedDate2}
            onValueChange={setSelectedDate2}
          />
        </CardContent>
      </Card>
    </div>
  );
}
