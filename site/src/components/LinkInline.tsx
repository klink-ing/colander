import { forwardRef } from "react";
import { Link } from "@tanstack/react-router";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { LinkProps } from "@tanstack/react-router";

type LinkInlineProps = Omit<LinkProps, "render" | "children"> & {
  render?: React.ReactElement;
  children?: React.ReactNode;
  className?: string;
};

const LINK_CLASSNAME =
  "text-link underline decoration-link/40 hover:text-link-hover hover:decoration-link-hover visited:text-link-visited";

const LinkInline = forwardRef<HTMLAnchorElement, LinkInlineProps>(
  function LinkInline({ render, className, children, ...routerProps }, ref) {
    return useRender({
      defaultTagName: "a" as const,
      render: render ?? <Link {...(routerProps as LinkProps)} />,
      ref: ref ? [ref] : [],
      state: {},
      props: mergeProps<"a">(
        { className: LINK_CLASSNAME },
        { className, children },
      ),
    });
  },
);

export { LinkInline };
export type { LinkInlineProps };
