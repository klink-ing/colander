import type React from "react";
import { LinkInline } from "./LinkInline";
import { Code } from "./ui/code";

/**
 * Renders a JSDoc description string with:
 * - `backtick` spans → <code>
 * - {@link SymbolName} → internal link to /docs/api/SymbolName
 * - {@link SymbolName display text} → link with custom text
 */
export default function InlineDescription({
  text,
  codeSize = 100,
}: {
  text: string;
  codeSize?: 100 | 200;
}) {
  if (!text) return null;

  const parts: (string | React.JSX.Element)[] = [];
  // Match `code`, {@link Name}, or {@link Name text}
  const regex = /`([^`]+)`|\{@link\s+(\S+?)(?:\s+([^}]+))?\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // Backtick code
      parts.push(
        <Code key={match.index} size={codeSize}>
          {match[1]}
        </Code>,
      );
    } else if (match[2] !== undefined) {
      // {@link SymbolName} or {@link SymbolName display text}
      const symbol = match[2];
      const display = match[3] ?? symbol;
      parts.push(
        <LinkInline key={match.index} to="/docs/api/$symbol" params={{ symbol }}>
          {display}
        </LinkInline>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
