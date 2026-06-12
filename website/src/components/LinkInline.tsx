import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentPropsWithRef } from "react";
import { cn } from "#/lib/utils";

/** Tailwind class string shared by the anchor and router variants. */
const LINK_INLINE_CLASSNAME =
  "text-link underline underline-offset-[0.15em]  decoration-link/30 hover:text-link-hover hover:decoration-link-hover visited:text-link-visited px-1 -mx-1 transition-all duration-200";

/**
 * `href` values permitted on the anchor branch of {@link LinkInline}.
 *
 * @internal Not part of the supported public API for this file; use {@link LinkInline} only.
 */
type AllowedExternalHref =
  | `//${string}`
  | `https://${string}`
  | `tel:${string}`
  | `mailto:${string}`;

/** Props for the `<a>` branch: standard anchor attributes with a constrained `href`. */
type AProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  href: AllowedExternalHref;
};

/** Props for the TanStack `Link` branch: router link props plus optional `className`. */
type TanstackLinkProps = Omit<LinkProps, "href"> & { className?: string };

/**
 * Returns whether `url` is treated as external for security and UX (new tab, `rel`).
 *
 * Matches RFC 3986-style absolute URIs (`scheme:`) and network-path references (`//authority…`).
 * Section 3.1 scheme: `ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )` then `:` (hierarchical
 * uses `//`, opaque e.g. `tel:`, `mailto:`). Section 4.2: `//` authority path-abempty
 * (scheme-relative URLs like `//example.com/foo`).
 *
 * @param url - Raw URL string, typically from `href`.
 * @returns `true` if the string has an absolute scheme or is a scheme-relative `//` URL.
 */
function isExternalUrl(url: string) {
  // Absolute URI with a registered-style scheme (https://…, tel:…, mailto:…, etc.).
  const hasAbsoluteScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url);
  // "//" then start of authority (not "///…"); third char may be "[" for IPv6 literals.
  const isSchemeRelative = /^\/\/[^/]/.test(url);
  return hasAbsoluteScheme || isSchemeRelative;
}

/**
 * Renders an `<a>` with the shared inline link class string for external / special `href` values.
 * Adds `target="_blank"` and `rel="noopener noreferrer"` when {@link isExternalUrl} is true.
 *
 * Logs a console error if both `href` and `to` are present, or if `href` is not external.
 */
function AInline({ className, ...props }: AProps) {
  if ((props as any).to) {
    // TypeScript should catch this, but we'll log it in case TypeScript is ignored.
    console.error(
      `<LinkInline href="${props.href}" to="${(props as any).to}">\nBoth \`href\` and \`to\` are set. You must choose one or the other. Defaulting to \`href\`.`,
    );
  }
  // Typescript should enforce that `href` is external only, but we'll log it in case TypeScript is ignored.
  const isExternal = isExternalUrl(props.href ?? "");

  if (!isExternal) {
    console.error(
      `<LinkInline href="${props.href}">\n\`href\` is not an external URL. Use \`<LinkInline to="${props.href}">\` for internal links.`,
    );
  }

  return (
    <a
      className={cn(LINK_INLINE_CLASSNAME, className)}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}

/**
 * Renders TanStack Router's `Link` with the same inline typography and hover styles as
 * the anchor branch.
 */
function TanstackLinkInline({ className, ...props }: TanstackLinkProps) {
  return <Link className={cn(LINK_INLINE_CLASSNAME, className)} {...props} />;
}

/**
 * Narrows the {@link LinkInline} prop union: a defined `href` selects {@link AProps}
 * (external anchor); otherwise props are treated as {@link TanstackLinkProps}.
 */
const isAProps = (props: any): props is AProps => {
  return props.href !== undefined;
};

/**
 * Doc-site inline link: either an in-app router link or a constrained external `<a>`.
 *
 * @param props -
 * - With `href`: {@link AProps} — must be `//…`, `https://…`, `tel:…`, or `mailto:…`.
 *   Non-external values log an error; see {@link isExternalUrl}.
 * - Without `href`: {@link TanstackLinkProps} — passed through to TanStack `Link` (e.g. `to`).
 *
 * @remarks
 * This is the **only** symbol from this module intended for imports elsewhere. If both
 * `href` and `to` appear (e.g. via spread), an error is logged and the anchor branch wins.
 */
function LinkInline(props: TanstackLinkProps | AProps) {
  if (isAProps(props)) {
    return <AInline {...props} />;
  }

  return <TanstackLinkInline {...props} />;
}

export { LinkInline };
