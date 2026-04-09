"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

function RadioGroup<TValue = any>({
  className,
  ...props
}: RadioGroupPrimitive.Props<TValue>) {
  return (
    <RadioGroupPrimitive<TValue>
      data-slot="radio-group"
      className={cn("grid w-full gap-1.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem<TValue = "string">({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props<TValue>) {
  return (
    <FieldPrimitive.Item>
      <FieldPrimitive.Label className="flex min-h-6 w-full items-center gap-2">
        <RadioPrimitive.Root
          data-slot="radio-group-item"
          className={cn(
            "group/radio-group-item peer relative flex aspect-square size-4.5 shrink-0 rounded-full border border-input ring-offset-1 ring-offset-primary-foreground outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-w-focus focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-w-focus aria-invalid:ring-focus-destructive aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
            className,
          )}
          {...props}
        >
          <RadioPrimitive.Indicator
            data-slot="radio-group-indicator"
            className="flex items-center justify-center"
          >
            <span className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
          </RadioPrimitive.Indicator>
        </RadioPrimitive.Root>
        <span className="text-trim-cap">
          {children ?? (props.value as ReactNode)}
        </span>
      </FieldPrimitive.Label>
    </FieldPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
