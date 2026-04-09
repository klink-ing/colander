import { useRender } from "@base-ui/react/use-render";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentPropsWithRef } from "react";
import { cn } from "#/lib/utils";

const LINK_CLASSNAME =
  "text-link underline decoration-link/40 hover:text-link-hover hover:decoration-link-hover visited:text-link-visited px-1 -mx-1";

// RFC 3986:
// - §3.1 scheme: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ), then ":" (hierarchical uses "//", opaque e.g. tel:, mailto:).
// - §4.2 network-path references: "//" authority path-abempty (scheme-relative URLs like //example.com/foo).
export function isExternalUrl(url: string) {
  // Absolute URI with a registered-style scheme (https://…, tel:…, mailto:…, etc.).
  const hasAbsoluteScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url);
  // "//" then start of authority (not "///…"); third char may be "[" for IPv6 literals.
  const isSchemeRelative = /^\/\/[^/]/.test(url);
  return hasAbsoluteScheme || isSchemeRelative;
}

function AInline({
  render,
  className,
  ...props
}: useRender.ComponentProps<"a">) {
  const isExternal = isExternalUrl(props.href ?? "");
  if (!isExternal) {
    console.error("External link detected, use LinkInline for internal links");
  }
  return useRender({
    defaultTagName: "a" as const,
    render,
    props: {
      className: cn(LINK_CLASSNAME, className),
      ...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}),
      ...props,
    },
  });
}

function LinkInline({
  className,
  ...props
}: LinkProps & ComponentPropsWithRef<"a">) {
  return <Link className={cn(LINK_CLASSNAME, className)} {...props} />;
}

export { AInline, LinkInline };
