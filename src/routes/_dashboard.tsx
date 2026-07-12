import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { Search, Bell } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/dashboard/command-palette";
import { StatusBadge } from "@/components/ui-kit/status-badge";

export const Route = createFileRoute("/_dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Invariant." }],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { open, setOpen } = useCommandPalette();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-background/80 px-4 backdrop-blur-xl">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="h-5 w-px bg-hairline" />
            <button
              onClick={() => setOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-hairline bg-surface/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search or jump to…</span>
              <kbd className="ml-4 hidden rounded border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-3">
              <StatusBadge status="stable" label="8 APIs" pulse />
              <button className="relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-breaking" />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={path}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </SidebarInset>
      </div>
      <CommandPalette open={open} setOpen={setOpen} />
    </SidebarProvider>
  );
}
