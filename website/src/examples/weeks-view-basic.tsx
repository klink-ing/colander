import { Temporal } from "@js-temporal/polyfill";
import {
  WeeksView,
  PrevWeeksButton,
  NextWeeksButton,
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  useWeeksViewState,
} from "@klinking/colander";

function VisibleMonthsLabel() {
  const { windowInfo } = useWeeksViewState();
  const label = windowInfo.visibleMonths
    .map(({ month, year }) =>
      new Date(year, month - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    )
    .join(" – ");
  return <span className="calendar-title">{label}</span>;
}

export function BasicWeeksView() {
  return (
    <WeeksView
      temporal={Temporal}
      weekCount={6}
      defaultFirstWeek={{ month: 6, year: 2026 }}
      scrollBy="row"
    >
      <div className="calendar">
        <div className="calendar-header">
          <PrevWeeksButton className="calendar-nav">↑</PrevWeeksButton>
          <VisibleMonthsLabel />
          <NextWeeksButton className="calendar-nav">↓</NextWeeksButton>
        </div>
        <Grid className="calendar-grid">
          <GridHeader>
            <GridHeaderCell className="calendar-weekday" />
          </GridHeader>
          <GridBody>
            <WeekTemplate>
              <DayCellTemplate>
                <DayButton className="calendar-day" />
              </DayCellTemplate>
            </WeekTemplate>
          </GridBody>
        </Grid>
      </div>
    </WeeksView>
  );
}
