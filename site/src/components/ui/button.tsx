import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center  border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 type-body-100 [text-box:trim-both_cap_alphabetic]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover ",
        outline:
          "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive-hover focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "squircle-xs h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "squircle-sm h-8 gap-1 px-2.5 ",
        default: "squircle-md h-9.5 gap-1.5 px-3.5 type-body-100-semi",
        lg: "squircle-lg h-11 gap-1.5 px-4.5  type-body-200-semi",
        xl: "squircle-xl h-13 gap-2 px-6  type-body-300-bold ",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface IconProps {
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function ButtonContent({
  iconStart,
  iconEnd,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <>
      {iconStart && (
        <span data-icon="inline-start" className="-ml-[0.1em] text-trim-both">
          {iconStart}
        </span>
      )}
      {children && <span className="text-trim-both">{children}</span>}
      {iconEnd && (
        <span data-icon="inline-end" className="-mr-[0.1em] text-trim-both">
          {iconEnd}
        </span>
      )}
    </>
  );
}

function Button({
  className,
  variant = "default",
  size = "default",
  iconStart,
  iconEnd,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & IconProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <ButtonContent
        iconStart={iconStart}
        iconEnd={iconEnd}
        children={children}
      />
    </ButtonPrimitive>
  );
}

function ButtonA({
  className,
  variant = "default",
  size = "default",
  render,
  iconStart,
  iconEnd,
  children,
  ...props
}: useRender.ComponentProps<"a"> &
  VariantProps<typeof buttonVariants> &
  IconProps) {
  return useRender({
    render,
    props: {
      className: cn(
        "h-auto [text-box:trim-both_ex_alphabetic]",
        buttonVariants({ variant, size, className }),
      ),
      ...props,
      children: (
        <ButtonContent
          iconStart={iconStart}
          iconEnd={iconEnd}
          children={children}
        />
      ),
    },
  });
}

export { Button, buttonVariants, ButtonA };
