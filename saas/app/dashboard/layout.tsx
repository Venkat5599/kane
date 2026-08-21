import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <main id="main-content" data-dashboard className="bg-background min-h-screen">
      <div className="flex w-full flex-col lg:flex-row">
        <DashboardNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
