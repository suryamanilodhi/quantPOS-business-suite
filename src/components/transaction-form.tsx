"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Printer, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { money } from "@/lib/format";

type Product = { id: string; name: string; sku: string; barcode?: string; sellingPrice: string; purchasePrice: string; taxPercent: string; currentStock: number };
type Party = { id: string; name: string };
type Item = { productId: string; quantity: number; price: number; taxPercent: number; discount: number };

export function TransactionForm({ mode }: { mode: "sale" | "purchase" }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [partyId, setPartyId] = useState("");
  const [payment, setPayment] = useState(mode === "sale" ? "CASH" : "PAID");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [query, setQuery] = useState("");
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((res) => res.ok ? res.json() : []),
      fetch(mode === "sale" ? "/api/customers" : "/api/vendors").then((res) => res.ok ? res.json() : [])
    ]).then(([productData, partyData]) => {
      setProducts(productData);
      setParties(partyData);
    });
  }, [mode]);

  const filteredProducts = products.filter((product) => `${product.name} ${product.sku} ${product.barcode ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const lineDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const discountTotal = lineDiscount + (mode === "sale" ? invoiceDiscount : 0);
    const taxTotal = items.reduce((sum, item) => sum + ((item.quantity * item.price - item.discount) * item.taxPercent) / 100, 0);
    return { subtotal, discountTotal, taxTotal, grandTotal: subtotal - discountTotal + taxTotal };
  }, [items, invoiceDiscount, mode]);

  function addProduct(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { productId: product.id, quantity: 1, price: Number(mode === "sale" ? product.sellingPrice : product.purchasePrice), taxPercent: Number(product.taxPercent), discount: 0 }];
    });
    setQuery("");
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const endpoint = mode === "sale" ? "/api/sales" : "/api/purchases";
    const payload = mode === "sale"
      ? { customerId: partyId, paymentMethod: payment, paymentStatus: payment === "CREDIT" ? "UNPAID" : "PAID", discount: invoiceDiscount, items }
      : { vendorId: partyId, paymentStatus: payment, items };
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "Unable to create invoice");
      return;
    }
    setLastInvoice(data);
    setItems([]);
    toast.success(`${mode === "sale" ? "Sale" : "Purchase"} ${data.invoiceNumber} saved`);
  }

  return (
    <>
      <PageHeader title={mode === "sale" ? "POS Billing" : "Create Purchase"} description={mode === "sale" ? "Fast billing with live stock checks, tax, discount, and print invoice UI." : "Receive vendor stock with multi-product purchase invoices."} />
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={mode === "sale" ? "Customer" : "Vendor"} value={partyId} onChange={(event) => setPartyId(event.target.value)} required={mode === "purchase"}>
              <option value="">{mode === "sale" ? "Walk-in customer" : "Select vendor"}</option>
              {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </SelectField>
            <SelectField label={mode === "sale" ? "Payment method" : "Payment status"} value={payment} onChange={(event) => setPayment(event.target.value)}>
              {(mode === "sale" ? ["CASH", "UPI", "CARD", "CREDIT"] : ["PAID", "UNPAID", "PARTIAL"]).map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectField>
          </div>
          <div className="mt-5">
            <Field label="Search product by name, SKU, or barcode" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type to search" />
            {query ? (
              <div className="mt-2 rounded-md border border-line bg-white shadow-sm">
                {filteredProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => addProduct(product)} className="flex w-full items-center justify-between border-b border-line px-3 py-2 text-left text-sm hover:bg-slate-50">
                    <span>{product.name} <span className="text-muted">({product.sku})</span></span>
                    <span className="text-muted">Stock {product.currentStock}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Tax %</th><th className="px-3 py-2">Discount</th><th /></tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  return (
                    <tr key={item.productId} className="border-t border-line">
                      <td className="px-3 py-2 font-medium">{product?.name}</td>
                      <td className="px-3 py-2"><input className="h-9 w-20 rounded-md border border-line px-2" type="number" value={item.quantity} min={1} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></td>
                      <td className="px-3 py-2"><input className="h-9 w-28 rounded-md border border-line px-2" type="number" value={item.price} min={0} onChange={(event) => updateItem(index, { price: Number(event.target.value) })} /></td>
                      <td className="px-3 py-2"><input className="h-9 w-20 rounded-md border border-line px-2" type="number" value={item.taxPercent} min={0} onChange={(event) => updateItem(index, { taxPercent: Number(event.target.value) })} /></td>
                      <td className="px-3 py-2"><input className="h-9 w-24 rounded-md border border-line px-2" type="number" value={item.discount} min={0} onChange={(event) => updateItem(index, { discount: Number(event.target.value) })} /></td>
                      <td className="px-3 py-2 text-right"><button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md p-2 text-danger hover:bg-red-50"><Trash2 size={16} /></button></td>
                    </tr>
                  );
                })}
                {items.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">Search and add products to begin.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Invoice summary</h2>
          {mode === "sale" ? <div className="mt-4"><Field label="Invoice discount" type="number" value={invoiceDiscount} onChange={(event) => setInvoiceDiscount(Number(event.target.value))} /></div> : null}
          <div className="mt-5 grid gap-3 text-sm">
            <Summary label="Subtotal" value={money(totals.subtotal)} />
            <Summary label="Discount" value={money(totals.discountTotal)} />
            <Summary label="Tax" value={money(totals.taxTotal)} />
            <div className="flex items-center justify-between border-t border-line pt-3 text-lg font-semibold"><span>Total</span><span>{money(totals.grandTotal)}</span></div>
          </div>
          <Button className="mt-6 w-full" disabled={items.length === 0}><Plus size={16} /> Save invoice</Button>
          {lastInvoice ? <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => window.print()}><Printer size={16} /> Print {lastInvoice.invoiceNumber}</Button> : null}
        </Card>
      </form>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted">{label}</span><span className="font-medium">{value}</span></div>;
}
