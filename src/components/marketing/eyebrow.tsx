import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground",
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-signal live-dot" />
      {children}
    </span>
  );
}
