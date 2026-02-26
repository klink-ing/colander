import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle data-testid="text-title">DatePicker</CardTitle>
          <CardDescription data-testid="text-selected-date">
            {selectedDate
              ? `Selected: ${format(selectedDate, "MMMM d, yyyy")}`
              : "Pick a date below"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <DatePicker.Root value={selectedDate} onValueChange={setSelectedDate}>
            <DatePicker.Header />
            <DatePicker.MonthGrid mode="grid" />
          </DatePicker.Root>
        </CardContent>
      </Card>
    </div>
  );
}
