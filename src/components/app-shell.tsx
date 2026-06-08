import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can, navItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AppChrome } from "@/components/app-chrome";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const shop = user.shopId ? await prisma.shop.findUnique({ where: { id: user.shopId } }) : null;
  if (!user.shopId && user.role !== "SUPER_ADMIN") redirect("/login");

  const visibleNav = navItems
    .filter((item) => can(user, item.permission))
    .filter((item) => ["Dashboard", "Staff", "Master Data", "Products", "Inventory", "Vendors", "Customers", "Purchases", "Sales"].includes(item.label));
  const displayName = user.name || user.email.split("@")[0] || "User";
  const shopName = shop?.name ?? "QuantPOS";

  return (
    <AppChrome displayName={displayName} shopName={shopName} visibleNav={visibleNav.map(({ href, label }) => ({ href, label }))}>
      {children}
    </AppChrome>
  );
}
