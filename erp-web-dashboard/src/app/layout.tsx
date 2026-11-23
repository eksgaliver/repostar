import type { Metadata } from "next";
import { DashboardShell } from "@/components/app-shell/DashboardShell";
import "./globals.css";
import "../components/arc/foundation.css";

export const metadata: Metadata = {
  title: "S.T.A.R.S · ERP Dashboard",
  description:
    "Multi-company HRIS, attendance and fleet logistics ERP for Wijaya Manggala Premier Lestari (WMPL).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-theme="light" className="h-full">
      <body className="min-h-full">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}