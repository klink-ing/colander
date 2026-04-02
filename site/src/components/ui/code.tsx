import { cn } from "#/lib/cn";

const sizeClasses = {
  100: "type-code-100",
  200: "type-code-200",
} as const;

function Code({
  size = 100,
  className,
  ...props
}: React.ComponentPropsWithRef<"code"> & {
  size?: keyof typeof sizeClasses;
}) {
  return <code className={cn(sizeClasses[size], className)} {...props} />;
}

export { Code };
