import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, FileClock, PackagePlus, ReceiptText, ShoppingCart, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const shopWhere = user.role === "SUPER_ADMIN" ? {} : { shopId: user.shopId! };
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [todaySales, monthlySales, weeklySales, products, customers, vendors, purchases, expenses, recentSales, recentPurchases, activity] = await Promise.all([
    prisma.sale.findMany({ where: { ...shopWhere, createdAt: { gte: startOfToday } } }),
    prisma.sale.findMany({ where: { ...shopWhere, createdAt: { gte: startOfMonth } } }),
    prisma.sale.findMany({ where: { ...shopWhere, createdAt: { gte: sevenDaysAgo } } }),
    prisma.product.findMany({ where: shopWhere, orderBy: { currentStock: "asc" } }),
    prisma.customer.count({ where: shopWhere }),
    prisma.vendor.count({ where: shopWhere }),
    prisma.purchase.findMany({ where: { ...shopWhere, createdAt: { gte: startOfMonth } } }),
    prisma.expense.findMany({ where: { ...shopWhere, date: { gte: startOfMonth } } }),
    prisma.sale.findMany({ where: shopWhere, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.purchase.findMany({ where: shopWhere, include: { vendor: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.activityLog.findMany({ where: shopWhere, include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const monthRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const purchaseTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.grandTotal), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.purchasePrice) * product.currentStock, 0);
  const lowStock = products.filter((product) => product.currentStock <= product.lowStockAlert);
  const outOfStock = products.filter((product) => product.currentStock <= 0);
  const grossProfit = monthlySales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0) - purchaseTotal - expenseTotal;

  const weeklyBars = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(sevenDaysAgo.getDate() + index);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const value = weeklySales.filter((sale) => sale.createdAt >= day && sale.createdAt < next).reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
    return { label: day.toLocaleDateString("en-IN", { weekday: "short" }), value };
  });
  const maxBar = Math.max(...weeklyBars.map((bar) => bar.value), 1);

  const stats = [
    { label: "Today sales", value: money(todayRevenue), detail: `${todaySales.length} invoices`, icon: <CircleDollarSign size={18} />, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Monthly revenue", value: money(monthRevenue), detail: `${monthlySales.length} paid or credit bills`, icon: <ReceiptText size={18} />, tone: "bg-brand-50 text-brand-700" },
    { label: "Gross position", value: money(grossProfit), detail: "Sales minus purchases and expenses", icon: <ShoppingCart size={18} />, tone: "bg-violet-50 text-violet-700" },
    { label: "Inventory value", value: money(inventoryValue), detail: `${products.length} products tracked`, icon: <Boxes size={18} />, tone: "bg-cyan-50 text-cyan-700" }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your shop performance, stock risk, cash movement, and team activity in one place."
        action={<Link href="/reports" className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium hover:bg-slate-50"><ReceiptText size={16} /> Open reports</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted">{stat.detail}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.tone}`}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">7 day revenue</h2>
              <p className="mt-1 text-sm text-muted">Daily billing trend from {shortDate(sevenDaysAgo)} to today.</p>
            </div>
            <Link href="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">Reports <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-6 flex h-72 items-end gap-3 border-b border-line">
            {weeklyBars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-brand-600 transition-all" style={{ height: `${Math.max(8, (bar.value / maxBar) * 230)}px` }} />
                <div className="text-center">
                  <p className="text-xs font-medium">{bar.label}</p>
                  <p className="text-[11px] text-muted">{money(bar.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Action required</h2>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="mt-5 grid gap-3">
            <RiskRow label="Low stock" value={lowStock.length} href="/inventory" />
            <RiskRow label="Out of stock" value={outOfStock.length} href="/products" />
            <RiskRow label="Customers" value={customers} href="/customers" />
            <RiskRow label="Vendors" value={vendors} href="/vendors" />
          </div>
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Top stock alerts</p>
            <div className="mt-3 grid gap-2">
              {lowStock.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{product.name}</span>
                  <span className="font-semibold text-warning">{product.currentStock} left</span>
                </div>
              ))}
              {lowStock.length === 0 ? <p className="text-sm text-muted">No low stock products right now.</p> : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <PanelTitle title="Quick actions" />
          <div className="mt-4 grid gap-2">
            <QuickLink href="/pos" icon={<CircleDollarSign size={17} />} label="Create sale" />
            <QuickLink href="/products/new" icon={<PackagePlus size={17} />} label="Add product" />
            <QuickLink href="/purchases/new" icon={<ShoppingCart size={17} />} label="Record purchase" />
            <QuickLink href="/activity" icon={<FileClock size={17} />} label="Review activity" />
          </div>
        </Card>

        <Card className="p-5">
          <PanelTitle title="Recent sales" />
          <div className="mt-4 divide-y divide-line">
            {recentSales.map((sale) => <Row key={sale.id} title={sale.invoiceNumber} meta={sale.customer?.name ?? "Walk-in customer"} value={money(sale.grandTotal)} />)}
            {recentSales.length === 0 ? <p className="text-sm text-muted">No sales yet.</p> : null}
          </div>
        </Card>

        <Card className="p-5">
          <PanelTitle title="Recent purchases" />
          <div className="mt-4 divide-y divide-line">
            {recentPurchases.map((purchase) => <Row key={purchase.id} title={purchase.invoiceNumber} meta={purchase.vendor.name} value={money(purchase.grandTotal)} />)}
            {recentPurchases.length === 0 ? <p className="text-sm text-muted">No purchases yet.</p> : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <PanelTitle title="Latest activity" />
        <div className="mt-4 grid gap-3">
          {activity.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 rounded-md border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{item.message}</p>
                <p className="text-xs text-muted">{item.user?.name ?? "System"} on {item.resource}</p>
              </div>
              <p className="text-xs text-muted">{shortDate(item.createdAt)}</p>
            </div>
          ))}
          {activity.length === 0 ? <p className="text-sm text-muted">No activity has been recorded yet.</p> : null}
        </div>
      </Card>
    </>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <h2 className="font-semibold">{title}</h2>;
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-11 items-center justify-between rounded-md border border-line px-3 text-sm font-medium hover:bg-slate-50">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <ArrowRight size={15} className="text-muted" />
    </Link>
  );
}

function RiskRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm hover:bg-slate-50">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </Link>
  );
}

function Row({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-muted">{meta}</p>
      </div>
      <p className="shrink-0 font-semibold">{value}</p>
    </div>
  );
}
