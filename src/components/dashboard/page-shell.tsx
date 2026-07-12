import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-hairline px-6 py-5 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn("p-6", className)}
    >
      {children}
    </motion.div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-surface/60",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <span className="text-sm font-medium">{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/30 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary ring-1 ring-inset ring-hairline">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
