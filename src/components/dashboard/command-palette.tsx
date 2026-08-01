import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Home,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApis } from "@/lib/apis.functions";
import { listIncidents } from "@/lib/incidents.functions";

const routes = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "API Inventory", to: "/apis", icon: Boxes },
  { label: "Contract Intelligence", to: "/contract", icon: GitCompareArrows },
  { label: "Drift Reports", to: "/drift", icon: Activity },
  { label: "Incident Center", to: "/incidents", icon: AlertTriangle },
  { label: "Reliability Graph", to: "/graph", icon: Network },
  { label: "AI Copilot", to: "/copilot", icon: Sparkles },
  { label: "GitHub Integration", to: "/github", icon: Github },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Landing page", to: "/", icon: Home },
] as const;

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const apisFn = useServerFn(listApis);
  const incidentsFn = useServerFn(listIncidents);

  const { data: apis = [] } = useQuery({
    queryKey: ["palette-apis"],
    queryFn: () => apisFn(),
    enabled: open,
  });
  const { data: incidents = [] } = useQuery({
    queryKey: ["palette-incidents"],
    queryFn: () => incidentsFn(),
    enabled: open,
  });

  const go = (to: string, params?: Record<string, string>) => {
    setOpen(false);
    navigate({ to, params } as never);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search routes, APIs, incidents…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {routes.map((r) => (
            <CommandItem
              key={r.to}
              value={`nav ${r.label}`}
              onSelect={() => go(r.to)}
            >
              <r.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {r.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="APIs">
          {apis.slice(0, 6).map((a) => (
            <CommandItem
              key={a.id}
              value={`api ${a.name}`}
              onSelect={() => go("/apis/$apiId", { apiId: a.id })}
            >
              <Boxes className="mr-2 h-4 w-4 text-muted-foreground" />
              {a.name}
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                genome {a.genome}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Incidents">
          {incidents.slice(0, 5).map((i) => (
            <CommandItem
              key={i.id}
              value={`incident ${i.code} ${i.title}`}
              onSelect={() => go("/incidents/$incidentId", { incidentId: i.id })}
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{i.title}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {i.code}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="ask copilot" onSelect={() => go("/copilot")}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            Ask the Copilot a question
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
