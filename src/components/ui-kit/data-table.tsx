import { useMemo, useState, useRef, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  mono?: boolean;
  align?: "left" | "right";
  defaultHidden?: boolean;
}

interface Filter {
  key: string;
  label: string;
  options: string[];
  match: (row: any, value: string) => boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  filters,
  onRowClick,
  searchPlaceholder = "Search…",
  right,
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (row: T) => string;
  filters?: Filter[];
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  right?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    null,
  );
  const [hidden, setHidden] = useState<Set<string>>(
    new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const [active, setActive] = useState(0);
  const [filterVals, setFilterVals] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const visibleCols = columns.filter((c) => !hidden.has(c.key));

  const rows = useMemo(() => {
    let r = [...data];
    if (query && searchKeys) {
      const q = query.toLowerCase();
      r = r.filter((row) => searchKeys(row).toLowerCase().includes(q));
    }
    if (filters) {
      for (const f of filters) {
        const v = filterVals[f.key];
        if (v && v !== "all") r = r.filter((row) => f.match(row, v));
      }
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        r.sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return r;
  }, [data, query, sort, filters, filterVals, columns, searchKeys]);

  const toggleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortValue) return;
    setSort((s) =>
      s?.key === key
        ? s.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, rows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter" && rows[active]) {
        onRowClick?.(rows[active]);
      }
    },
    [rows, active, onRowClick],
  );

  return (
    <div className="rounded-xl border border-hairline bg-surface/60">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-hairline bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-signal/40 focus:ring-2 focus:ring-signal/10"
          />
        </div>

        {filters?.map((f) => (
          <select
            key={f.key}
            value={filterVals[f.key] ?? "all"}
            onChange={(e) =>
              setFilterVals((v) => ({ ...v, [f.key]: e.target.value }))
            }
            className="rounded-lg border border-hairline bg-background px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-signal/40"
          >
            <option value="all">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}

        {right}

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Columns</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={!hidden.has(c.key)}
                onCheckedChange={(v) =>
                  setHidden((h) => {
                    const n = new Set(h);
                    if (v) n.delete(c.key);
                    else n.add(c.key);
                    return n;
                  })
                }
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* table */}
      <div
        className="max-h-[calc(100vh-16rem)] overflow-auto outline-none"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-hairline">
              {visibleCols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70",
                    c.sortValue && "cursor-pointer select-none hover:text-foreground",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      c.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {c.header}
                    {c.sortValue &&
                      (sort?.key === c.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef} className="divide-y divide-hairline">
            {rows.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => {
                  setActive(i);
                  onRowClick?.(row);
                }}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer",
                  i === active ? "bg-surface-raised" : "hover:bg-surface-raised/60",
                )}
              >
                {visibleCols.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3",
                      c.mono && "font-mono tabular-nums",
                      c.align === "right" && "text-right",
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleCols.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No matching rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 font-mono text-xs text-muted-foreground">
        <span>
          {rows.length} of {data.length} rows
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <Check className="h-3 w-3 text-stable" /> ↑↓ to navigate · Enter to open
        </span>
      </div>
    </div>
  );
}
