import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  GitCompareArrows,
  Activity,
  AlertTriangle,
  Network,
  Sparkles,
  Github,
  Settings,
  ChevronsUpDown,
  ArrowLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Monitor",
    items: [
      { title: "API Inventory", url: "/apis", icon: Boxes },
      { title: "Contract Intelligence", url: "/contract", icon: GitCompareArrows },
      { title: "Drift Reports", url: "/drift", icon: Activity },
    ],
  },
  {
    label: "Investigate",
    items: [
      { title: "Incident Center", url: "/incidents", icon: AlertTriangle },
      { title: "Reliability Graph", url: "/graph", icon: Network },
      { title: "AI Copilot", url: "/copilot", icon: Sparkles },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "GitHub", url: "/github", icon: Github },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/apis" ? path.startsWith("/apis") : path === url;

  return (
    <Sidebar collapsible="icon" className="border-hairline">
      <SidebarHeader className="border-b border-hairline">
        <Link
          to="/"
          className="flex items-center gap-2 px-1 py-1.5 group/logo"
          title="Back to home"
        >
          {collapsed ? (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand/15 ring-1 ring-inset ring-brand/30">
              <Activity className="h-4 w-4 text-brand" strokeWidth={2.5} />
            </span>
          ) : (
            <>
              <Wordmark />
              <ArrowLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover/logo:text-foreground" />
            </>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && (
              <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="group/link">
                          <item.icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              active ? "text-signal" : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              active ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-hairline">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Maya Chen">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-analyzing/20 font-mono text-xs font-semibold text-analyzing ring-1 ring-inset ring-analyzing/30">
                MC
              </span>
              {!collapsed && (
                <>
                  <div className="flex flex-1 flex-col text-left leading-tight">
                    <span className="text-sm font-medium">Maya Chen</span>
                    <span className="text-xs text-muted-foreground">
                      Acme · Platform
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
