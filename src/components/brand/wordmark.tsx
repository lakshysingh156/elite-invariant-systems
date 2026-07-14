import { cn } from "@/lib/utils";

/**
 * Infinity-loop brand mark. Two interlocked open loops rendered as a single
 * stroked path — reads at 20px in the sidebar and at hero scale.
 */
export function BrandMark({
  className,
  size = 22,
  strokeWidth = 2.2,
}: {
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Left loop */}
      <path d="M17 6 C 8 6, 4 12, 4 16 C 4 20, 8 26, 17 26 C 24 26, 28 20, 31 16 C 34 12, 38 6, 45 6" />
      {/* Right loop crossing under */}
      <path d="M45 26 C 38 26, 34 20, 31 16 C 28 12, 24 6, 17 6" opacity="0.55" />
    </svg>
  );
}

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
      <BrandMark
        size={size === "md" ? 22 : 18}
        className="text-foreground"
      />
      <span>
        Invariant<span className="text-brand">.</span>
      </span>
    </span>
  );
}
