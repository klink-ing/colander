import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { StyledDatePicker } from "@/components/styled-date-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Temporal.PlainDate | undefined>();

  const displayText = selectedDate
    ? `Selected: ${new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
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
            value={selectedDate}
            onValueChange={(v) => setSelectedDate(v as Temporal.PlainDate)}
            valueFormat="PlainDate"
          />
        </CardContent>
      </Card>
    </div>
  );
}
