import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentPropsWithRef } from "react";
import { cn } from "#/lib/utils";

const LINK_INLINE_CLASSNAME =
  "text-link underline underline-offset-[0.15em]  decoration-link/30 hover:text-link-hover hover:decoration-link-hover visited:text-link-visited px-1 -mx-1 transition-all duration-200";

/** External / special `href` values allowed on `AInline`. */
export type AllowedExternalHref =
  | `//${string}`
  | `https://${string}`
  | `tel:${string}`
  | `mailto:${string}`;

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

function LinkInline({
  className,
  ...props
}: LinkProps & { href: AllowedExternalHref } & Omit<
    ComponentPropsWithRef<"a">,
    "href"
  >) {
  const isExternal = isExternalUrl(props.href ?? "");
  if (!isExternal) {
    console.error(
      `Internal link detected, use LinkInline for internal links: ${props.href}`,
    );
  }
  return (
    <Link
      className={cn(LINK_INLINE_CLASSNAME, className)}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}

export { LinkInline };
