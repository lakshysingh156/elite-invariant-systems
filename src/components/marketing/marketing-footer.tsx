import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/wordmark";

const cols = [
  {
    title: "Product",
    links: ["Features", "Architecture", "Pricing", "Changelog", "Docs"],
  },
  { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "SLA"] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The AI reliability engineer for your APIs. Detect drift, prevent
            outages, ship faster.
          </p>
          <div className="mt-5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-stable live-dot" />
            All systems operational
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {c.title}
            </div>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span className="font-mono">© 2026 Invariant. — v1.0</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/dashboard" className="hover:text-foreground">
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
