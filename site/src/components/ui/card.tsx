import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/cn";

function Card({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    props: {
      className: cn("border border-border bg-card p-5 transition", className),
      ...props,
    },
  });
}

export { Card };
