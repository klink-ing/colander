# Colander

A headless React library of calendar and date-picker building blocks. Consumers compose a View and its parts to build their own calendar UI.

## Language

**View**:
A layout strategy that decides which days are shown and how focus moves between them. Today: `MonthView` and `WeeksView`.
_Avoid_: Mode, layout, calendar type

**Grid**:
The table that renders a View's days. It looks the same to consumers whichever View it sits in.
_Avoid_: Calendar, table
