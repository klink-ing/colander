import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { StyledDatePicker } from "@/components/styled-date-picker";
import type { DatePickerValueForFormat } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ZonedValue = DatePickerValueForFormat<"ZonedDateTime">;

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<ZonedValue | undefined>();

  const displayText = selectedDate
    ? `Selected: ${new Date(selectedDate.value.epochMilliseconds).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${selectedDate.value.timeZoneId})`
    : "Pick a date below";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle data-testid="text-title">DatePicker</CardTitle>
          <CardDescription data-testid="text-selected-date">
            {displayText}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <StyledDatePicker
            format="ZonedDateTime"
            value={selectedDate}
            onValueChange={setSelectedDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
