import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/dashboard/command-palette";
import { TopBar } from "@/components/dashboard/top-bar";

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
          <TopBar onOpenPalette={() => setOpen(true)} />

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
