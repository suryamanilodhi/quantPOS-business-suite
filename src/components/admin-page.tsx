"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiMessage } from "@/lib/client-api";

export function AdminPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const toast = useToast();

  const load = useCallback(async () => {
    const [shopsResponse, plansResponse] = await Promise.all([fetch("/api/shops"), fetch("/api/plans")]);
    if (shopsResponse.ok) setShops(await shopsResponse.json());
    else toast.error(await apiMessage(shopsResponse, "Unable to load shops"));
    if (plansResponse.ok) setPlans(await plansResponse.json());
    else toast.error(await apiMessage(plansResponse, "Unable to load plans"));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(shop: any) {
    const response = await fetch(`/api/shops/${shop.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !shop.active }) });
    if (!response.ok) {
      toast.error(await apiMessage(response, "Unable to update shop"));
      return;
    }
    toast.success(shop.active ? "Shop deactivated" : "Shop activated");
    await load();
  }

  return (
    <>
      <PageHeader title="Super Admin" description="Manage shops, platform users, subscriptions, and platform analytics." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted">Shops</p><p className="mt-2 text-2xl font-semibold">{shops.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Active shops</p><p className="mt-2 text-2xl font-semibold">{shops.filter((shop) => shop.active).length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Plans</p><p className="mt-2 text-2xl font-semibold">{plans.length}</p></Card>
      </div>
      <Card>
        <div className="border-b border-line p-4"><h2 className="font-semibold">All shops</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="px-4 py-3">Shop</th><th className="px-4 py-3">Users</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody>{shops.map((shop) => <tr key={shop.id} className="border-t border-line"><td className="px-4 py-3 font-medium">{shop.name}</td><td className="px-4 py-3">{shop.users?.length ?? 0}</td><td className="px-4 py-3">{shop.plan?.name ?? "Trial"}</td><td className="px-4 py-3">{shop.active ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-right"><Button variant="secondary" onClick={() => toggle(shop)}>{shop.active ? "Deactivate" : "Activate"}</Button></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Subscription plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">{plans.map((plan) => <div key={plan.id} className="rounded-md border border-line p-4"><p className="font-semibold">{plan.name}</p><p className="mt-1 text-2xl font-semibold">₹{plan.priceInr}</p><p className="mt-2 text-sm text-muted">{plan.staffLimit} staff · {plan.productLimit} products</p></div>)}</div>
      </Card>
    </>
  );
}
