import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-foreground",
        size === "md" ? "text-[15px]" : "text-sm",
        className,
      )}
    >
      <span className="grid h-6 w-6 place-items-center rounded-md bg-signal/15 ring-1 ring-inset ring-signal/30">
        <Activity className="h-3.5 w-3.5 text-signal" strokeWidth={2.5} />
      </span>
      Invariant<span className="text-signal">.</span>
    </span>
  );
}
