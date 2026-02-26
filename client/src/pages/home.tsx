import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Temporal.PlainDate | undefined>();

  const displayText = selectedDate
    ? `Selected: ${MONTH_NAMES[selectedDate.month - 1]} ${selectedDate.day}, ${selectedDate.year}`
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
          <DatePicker.Root
            value={selectedDate}
            onValueChange={(v) => setSelectedDate(v as Temporal.PlainDate)}
            valueFormat="PlainDate"
          >
            <DatePicker.Header />
            <DatePicker.MonthGrid mode="grid" />
          </DatePicker.Root>
        </CardContent>
      </Card>
    </div>
  );
}
