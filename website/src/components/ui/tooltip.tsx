"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "#/lib/utils";

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const borderWidth = 1;
const borderOffset = Math.sqrt(borderWidth * borderWidth * 0.5) - borderWidth;
const arrowCenterOffset = 4;

function TooltipContent({
  className,
  side = "top",
  sideOffset = 10,
  align = "center",
  alignOffset = 0,
  arrowPadding = 12,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "arrowPadding"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        arrowPadding={arrowPadding}
        sideOffset={sideOffset}
        className="isolate z-50 flex max-h-(--available-height) w-fit max-w-[min(100%,var(--breakpoint-bp-4))] transition-all duration-150"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "flex max-h-full w-fit max-w-full grow-0 items-center squircle-md border-border bg-card text-xs shadow-2xl transition-all duration-150 has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
          render={({ style, ...props }) => (
            <div
              {...props}
              style={{
                ...style,
                borderWidth,
              }}
            />
          )}
        >
          <div className="scrollbar-track-background/20 z-20 h-full w-full overflow-auto squircle-[calc(var(--radius-md)-1px)] bg-card px-3 py-1.5 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]">
            {children}
          </div>
          <TooltipPrimitive.Arrow
            className=""
            render={({ className, style, ...props }, state) => (
              <div
                {...props}
                className={cn(
                  "absolute z-10 size-2 origin-center translate-x-[-50%] translate-y-[-50%] border-border bg-card",
                  className,
                )}
                style={{
                  ...style,
                  borderRightWidth: borderWidth,
                  borderBottomWidth: borderWidth,
                  top:
                    state.side === "top"
                      ? `calc(100% + ${borderOffset}px)`
                      : state.side === "bottom"
                        ? `${borderOffset}px`
                        : state.align === "start"
                          ? arrowPadding + arrowCenterOffset
                          : state.align === "end"
                            ? `calc(100% - ${arrowPadding + arrowCenterOffset}px)`
                            : "50%",
                  left:
                    state.side === "top" || state.side === "bottom"
                      ? state.align === "start"
                        ? arrowPadding + 5
                        : state.align === "end"
                          ? `calc(100% - ${arrowPadding + arrowCenterOffset}px)`
                          : `50%`
                      : state.side === "left" || state.side === "inline-start"
                        ? `calc(100% + ${borderOffset}px)`
                        : `${borderOffset}px`,
                  rotate: `${
                    state.side === "left"
                      ? -45
                      : state.side === "bottom"
                        ? -135
                        : state.side === "top"
                          ? 45
                          : 135
                  }deg`,
                  translate: `${state.side === "right" ? "0" : state.side === "left" ? "100%" : "50%"} ${state.side === "bottom" ? "100%" : state.side === "top" ? "0" : "50%"}`,
                }}
              />
            )}
          />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
