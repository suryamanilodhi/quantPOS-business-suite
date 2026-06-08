"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Boxes, Database, LayoutDashboard, Menu, Package, Receipt, ShoppingCart, Sofa, Truck, Users, X } from "lucide-react";

type MobileNavItem = {
  href: string;
  label: string;
};

type MobileNavProps = {
  items: MobileNavItem[];
  shopName: string;
};

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={17} />,
  Staff: <Users size={17} />,
  "Master Data": <Database size={17} />,
  Products: <Package size={17} />,
  Inventory: <Boxes size={17} />,
  Vendors: <Truck size={17} />,
  Customers: <Users size={17} />,
  Purchases: <ShoppingCart size={17} />,
  Sales: <Receipt size={17} />
};

export function MobileNav({ items, shopName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu size={20} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-blue-950/45"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-80 max-w-[86vw] flex-col border-r border-line bg-white shadow-soft">
            <div className="flex h-[76px] items-center justify-between border-b border-line px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-white">
                  <Sofa size={21} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">QuantPOS</p>
                  <p className="truncate text-[12px] text-muted">{shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="grid gap-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-11 items-center gap-3 rounded-md px-3 text-[14px] font-medium ${
                      active ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-slate-400"}>{iconMap[item.label]}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
