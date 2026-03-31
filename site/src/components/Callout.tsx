import type { ReactNode } from "react";

const styles = {
  info: {
    border: "border-callout-info-border",
    bg: "bg-callout-info-bg",
    text: "text-callout-info-text",
    icon: "i",
  },
  warning: {
    border: "border-callout-warn-border",
    bg: "bg-callout-warn-bg",
    text: "text-callout-warn-text",
    icon: "!",
  },
  error: {
    border: "border-callout-error-border",
    bg: "bg-callout-error-bg",
    text: "text-callout-error-text",
    icon: "!!",
  },
} as const;

export default function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "error";
  children: ReactNode;
}) {
  const s = styles[type];
  return (
    <div
      className={`my-4 rounded-lg border type-body-100 ${s.border} ${s.bg} p-4 ${s.text}`}
    >
      {children}
    </div>
  );
}
