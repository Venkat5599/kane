"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  RefreshCw,
  Activity,
  Database,
  Github,
} from "lucide-react";

const home = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Loop", icon: RefreshCw, href: "/dashboard/loop" },
  { label: "Runs", icon: Activity, href: "/dashboard/runs" },
];

const evidence = [{ label: "Evidence", icon: Database, href: "/dashboard/evidence" }];

function Item({
  label,
  icon: Icon,
  href,
  active,
}: {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  active: boolean;
}): ReactNode {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
          active
            ? "bg-foreground/8 text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}

export function DashboardNav(): ReactNode {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-frame shrink-0 border-b lg:min-h-screen lg:w-60 lg:border-r lg:border-b-0">
      <div className="lg:sticky lg:top-0">
        <Link href="/" className="border-border flex items-center gap-2.5 border-b px-5 py-5">
          <span className="bg-foreground h-5 w-5 rounded-full" aria-hidden="true" />
          <span className="text-foreground text-[15px] font-semibold">kane-loop</span>
        </Link>

        <nav className="px-3 py-4" aria-label="Dashboard">
          <p className="text-muted-foreground px-2 pb-2 text-xs">Home</p>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {home.map((item) => (
              <Item key={item.href} {...item} active={pathname === item.href} />
            ))}
          </ul>

          <p className="text-muted-foreground px-2 pt-6 pb-2 text-xs">Evidence</p>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {evidence.map((item) => (
              <Item key={item.href} {...item} active={pathname === item.href} />
            ))}
            <li>
              <a
                href="https://github.com/Venkat5599/kane"
                className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
              >
                <Github className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                Repository
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
