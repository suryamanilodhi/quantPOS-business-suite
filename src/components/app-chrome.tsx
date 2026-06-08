"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Boxes,
  CircleUserRound,
  Database,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShoppingCart,
  Sofa,
  Truck,
  Users
} from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
};

type AppChromeProps = {
  children: React.ReactNode;
  displayName: string;
  shopName: string;
  visibleNav: NavItem[];
};

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={18} />,
  Staff: <Users size={18} />,
  "Master Data": <Database size={18} />,
  Products: <Package size={18} />,
  Inventory: <Boxes size={18} />,
  Vendors: <Truck size={18} />,
  Customers: <Users size={18} />,
  Purchases: <ShoppingCart size={18} />,
  Sales: <Receipt size={18} />
};

export function AppChrome({ children, displayName, shopName, visibleNav }: AppChromeProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const sidebarWidth = sidebarOpen ? "lg:pl-[286px]" : "lg:pl-[88px]";

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-white shadow-[4px_0_22px_rgba(15,23,42,0.07)] transition-all duration-300 lg:flex lg:flex-col ${
          sidebarOpen ? "w-[286px]" : "w-[88px]"
        }`}
      >
        <div className={`flex h-[118px] items-center border-b border-line px-5 ${sidebarOpen ? "gap-4" : "justify-center"}`}>
          <Link
            href="/dashboard"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-brand-600 bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
            aria-label="Dashboard"
          >
            <Sofa size={26} strokeWidth={1.8} />
          </Link>
          {sidebarOpen ? (
            <div className="min-w-0">
              <Link href="/dashboard" className="block truncate text-[15px] font-semibold text-ink">
                {shopName}
              </Link>
              <p className="mt-1 truncate text-[13px] font-medium text-muted">Furniture retail suite</p>
            </div>
          ) : null}
        </div>

        <nav className="grid gap-1 px-3 py-5">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex h-11 items-center rounded-md px-3 text-[14px] font-medium transition ${
                  sidebarOpen ? "gap-3" : "justify-center"
                } ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "text-muted hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${active ? "text-white" : "text-ink"}`}>
                  {iconMap[item.label]}
                </span>
                {sidebarOpen ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-line p-4 ${sidebarOpen ? "" : "flex justify-center"}`}>
          <div className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <CircleUserRound size={20} />
            </div>
            {sidebarOpen ? (
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{displayName}</p>
                <p className="truncate text-[12px] font-medium text-muted">My Account</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${sidebarWidth}`}>
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-white/95 px-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <MobileNav items={visibleNav} shopName={shopName} />
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="hidden h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-slate-100 lg:inline-flex"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold uppercase text-muted">Welcome</p>
              <h1 className="truncate text-[18px] font-semibold leading-tight text-ink sm:text-[20px]">{displayName}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button className="hidden h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-slate-100 sm:inline-flex" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <Link href="/settings" className="hidden h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-slate-100 sm:inline-flex" aria-label="Settings">
              <Settings size={18} />
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:px-4">
                <LogOut size={17} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto grid max-w-7xl gap-6 p-4 text-[14px] lg:p-6">{children}</main>
      </div>
    </div>
  );
}
