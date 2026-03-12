import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Temporal } from "@js-temporal/polyfill";
import { createDatePicker } from "base-ui-cal";

const DP = createDatePicker("PlainDate", { temporal: Temporal });

const march10 = Temporal.PlainDate.from("2026-03-10");
const march20 = Temporal.PlainDate.from("2026-03-20");

function BenchCalendar() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Signal that mount is complete
    wrapperRef.current?.setAttribute("data-bench-ready", "");
    performance.mark("mount-end");
    performance.measure("mount", "mount-start", "mount-end");
  }, []);

  return (
    <div ref={wrapperRef}>
      <DP.Root
        selectionMode="range"
        fixedWeeks
        defaultValue={{ start: march10, end: march20 }}
        locale="en-US"
        timeZone="UTC"
      >
        <DP.Grid />
      </DP.Root>
    </div>
  );
}

performance.mark("mount-start");
createRoot(document.getElementById("root")!).render(<BenchCalendar />);
