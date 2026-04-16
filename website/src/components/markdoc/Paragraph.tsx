import { cn } from "#/lib/utils";

export default function Paragraph({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mb-4 type-body-200 text-muted-foreground", className)}>
      {children}
    </p>
  );
}
