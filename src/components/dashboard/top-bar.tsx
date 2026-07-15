import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Check,
  Building2,
  GitBranch,
  Rocket,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const orgs = ["Acme Corp", "Acme Staging", "Personal"];
const envs = [
  { id: "prod", label: "Production", tone: "signal" },
  { id: "staging", label: "Staging", tone: "drift" },
  { id: "dev", label: "Development", tone: "analyzing" },
] as const;

function Dropdown({
  trigger,
  children,
  width = "w-56",
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="group flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-2.5 text-xs font-medium text-foreground/90 transition-colors hover:bg-surface"
      >
        {trigger}
        <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-focus:rotate-180" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-hairline bg-popover shadow-xl elevate",
            width,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [org, setOrg] = useState(orgs[0]);
  const [env, setEnv] = useState<(typeof envs)[number]>(envs[0]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-background/85 px-3 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground" />
      <div className="mx-1 h-5 w-px bg-hairline" />

      <Dropdown
        trigger={
          <>
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[9rem] truncate">{org}</span>
          </>
        }
      >
        {(close) => (
          <div className="p-1">
            {orgs.map((o) => (
              <button
                key={o}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOrg(o);
                  close();
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
              >
                <span>{o}</span>
                {o === org && <Check className="h-3 w-3 text-signal" />}
              </button>
            ))}
            <div className="mt-1 border-t border-hairline pt-1">
              <button className="w-full rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary">
                + New workspace
              </button>
            </div>
          </div>
        )}
      </Dropdown>

      <Dropdown
        trigger={
          <>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                env.tone === "signal"
                  ? "bg-signal live-dot"
                  : env.tone === "drift"
                    ? "bg-drift"
                    : "bg-analyzing",
              )}
            />
            <span>{env.label}</span>
          </>
        }
        width="w-48"
      >
        {(close) => (
          <div className="p-1">
            {envs.map((e) => (
              <button
                key={e.id}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  setEnv(e);
                  close();
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      e.tone === "signal"
                        ? "bg-signal"
                        : e.tone === "drift"
                          ? "bg-drift"
                          : "bg-analyzing",
                    )}
                  />
                  {e.label}
                </span>
                {e.id === env.id && <Check className="h-3 w-3 text-signal" />}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <button
        onClick={onOpenPalette}
        className="ml-1 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-hairline bg-surface/60 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-surface md:max-w-md"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          Search APIs, incidents, changes, endpoints…
        </span>
        <kbd className="ml-auto hidden rounded border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* live status strip */}
        <div className="hidden items-center gap-3 rounded-md border border-hairline bg-surface/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal live-dot" />
            <span className="text-foreground">99.97%</span>
            <span>reliability</span>
          </span>
          <span className="h-3 w-px bg-hairline" />
          <span>
            <span className="text-foreground">127</span> APIs
          </span>
          <span className="h-3 w-px bg-hairline" />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-breaking" />
            <span className="text-foreground">2</span> active
          </span>
        </div>

        {/* deploy status */}
        <div className="hidden items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-2 py-1 font-mono text-[11px] text-muted-foreground lg:flex">
          <GitBranch className="h-3 w-3" />
          <span className="text-foreground/80">main</span>
          <span>·</span>
          <Rocket className="h-3 w-3 text-signal" />
          <span>7f2a1b3</span>
        </div>

        <button className="relative grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-breaking live-dot" />
        </button>

        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand to-signal ring-1 ring-hairline" />
      </div>
    </header>
  );
}
