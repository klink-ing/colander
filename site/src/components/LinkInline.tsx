import { cn } from "#/lib/utils";
import {
  useRender,
  type UseRenderComponentProps,
} from "@base-ui/react/use-render";
import type { LinkProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const LINK_CLASSNAME =
  "text-link underline decoration-link/40 hover:text-link-hover hover:decoration-link-hover visited:text-link-visited";

function AInline({
  render,
  className,
  children,
  ...props
}: UseRenderComponentProps<"a">) {
  return useRender({
    defaultTagName: "a" as const,
    props: {
      className: cn(LINK_CLASSNAME, className),
      ...props,
    },
  });
}

function LinkInline(props: LinkProps) {
  return <Link className={cn()} {...props} />;
}

export { AInline, LinkInline };
