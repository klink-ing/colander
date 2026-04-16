import { cn } from "#/lib/utils";

const headingTypeClass: Record<number, string> = {
  1: "type-display-300",
  2: "type-heading-200",
  3: "type-heading-100",
  4: "type-label-200",
  5: "type-label-100",
  6: "type-heading-100",
};

export default function Heading({
  level,
  id,
  children,
  className,
}: {
  level: number;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag
      id={id}
      className={cn(
        headingTypeClass[level] ?? "type-heading-100",
        "mt-8 mb-4 text-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
