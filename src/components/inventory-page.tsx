"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiMessage } from "@/lib/client-api";

export function InventoryPage() {
  const [data, setData] = useState<any>({ products: [], movements: [], lowStock: [] });
  const toast = useToast();

  const load = useCallback(async () => {
    const response = await fetch("/api/inventory");
    if (response.ok) setData(await response.json());
    else toast.error(await apiMessage(response, "Unable to load inventory"));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      toast.error(await apiMessage(response, "Adjustment failed"));
      return;
    }
    toast.success("Stock updated");
    event.currentTarget.reset();
    await load();
  }

  return (
    <>
      <PageHeader title="Stock" description="Add stock, remove stock, check low stock, and see every stock movement in one place." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Add or remove stock</h2>
          <form onSubmit={adjust} className="mt-4 grid gap-4">
            <SelectField label="Product" name="productId" required>
              <option value="">Select product</option>
              {data.products.map((product: any) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </SelectField>
            <SelectField label="What do you want to do?" name="type" required>
              <option value="STOCK_IN">Add stock</option>
              <option value="STOCK_OUT">Remove stock</option>
              <option value="ADJUSTMENT">Correction</option>
            </SelectField>
            <Field label="Quantity" name="quantity" type="number" required />
            <Field label="Note" name="note" placeholder="Bill no., supplier, reason" />
            <Button>Save stock</Button>
          </form>
        </Card>
        <Card>
          <div className="border-b border-line p-4">
            <h2 className="text-lg font-semibold">Current stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Available</th><th className="px-4 py-3">Low alert</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody>
                {data.products.map((product: any) => <tr key={product.id} className="border-t border-line"><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3">{product.sku}</td><td className="px-4 py-3">{product.currentStock}</td><td className="px-4 py-3">{product.lowStockAlert}</td><td className="px-4 py-3">{product.currentStock <= product.lowStockAlert ? <span className="text-warning">Low stock</span> : "Good"}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card>
        <div className="border-b border-line p-4"><h2 className="text-lg font-semibold">Stock history</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Note</th></tr></thead>
            <tbody>{data.movements.map((move: any) => <tr key={move.id} className="border-t border-line"><td className="px-4 py-3">{new Date(move.createdAt).toLocaleString("en-IN")}</td><td className="px-4 py-3">{move.product.name}</td><td className="px-4 py-3">{stockActionLabel(move.type)}</td><td className="px-4 py-3">{move.quantity}</td><td className="px-4 py-3">{move.reference ?? move.note}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function stockActionLabel(type: string) {
  const labels: Record<string, string> = {
    OPENING: "Opening stock",
    STOCK_IN: "Stock added",
    STOCK_OUT: "Stock removed",
    ADJUSTMENT: "Correction",
    PURCHASE: "Purchase",
    SALE: "Sale"
  };
  return labels[type] ?? type;
}
