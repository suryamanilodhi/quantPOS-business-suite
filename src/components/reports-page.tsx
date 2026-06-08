"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { money } from "@/lib/format";

export function ReportsPage() {
  const [data, setData] = useState<any | null>(null);

  async function load(params = "") {
    const response = await fetch(`/api/reports${params}`);
    if (response.ok) setData(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(event.currentTarget) as any).toString();
    load(`?${params}`);
  }

  function exportCsv() {
    if (!data) return;
    const rows = [["Report", "Count", "Total"], ["Sales", data.sales.length, data.summary.salesTotal], ["Purchases", data.purchases.length, data.summary.purchaseTotal], ["Expenses", data.expenses.length, data.summary.expenseTotal], ["Profit", "", data.summary.profit]];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "quantpos-report.csv";
    link.click();
  }

  return (
    <>
      <PageHeader title="Reports" description="Sales, purchases, inventory, profit/loss, customer, and vendor reports." action={<Button onClick={exportCsv} variant="secondary">Export CSV</Button>} />
      <Card className="p-5">
        <form onSubmit={filter} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="From" name="from" type="date" />
          <Field label="To" name="to" type="date" />
          <Button>Apply filters</Button>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sales", data?.summary.salesTotal],
          ["Purchases", data?.summary.purchaseTotal],
          ["Expenses", data?.summary.expenseTotal],
          ["Profit / loss", data?.summary.profit]
        ].map(([label, value]) => <Card key={label} className="p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{money(Number(value ?? 0))}</p></Card>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportTable title="Sales report" rows={data?.sales ?? []} columns={["invoiceNumber", "grandTotal", "paymentStatus"]} />
        <ReportTable title="Purchase report" rows={data?.purchases ?? []} columns={["invoiceNumber", "grandTotal", "paymentStatus"]} />
        <ReportTable title="Inventory report" rows={data?.products ?? []} columns={["name", "currentStock", "lowStockAlert"]} />
        <ReportTable title="Customer report" rows={data?.customers ?? []} columns={["name", "phone", "email"]} />
        <ReportTable title="Vendor report" rows={data?.vendors ?? []} columns={["name", "phone", "email"]} />
        <ReportTable title="Expense report" rows={data?.expenses ?? []} columns={["category", "amount", "date"]} />
      </div>
    </>
  );
}

function ReportTable({ title, rows, columns }: { title: string; rows: any[]; columns: string[] }) {
  return (
    <Card>
      <div className="border-b border-line p-4"><h2 className="font-semibold">{title}</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead>
          <tbody>
            {rows.slice(0, 8).map((row) => <tr key={row.id} className="border-t border-line">{columns.map((column) => <td key={column} className="px-4 py-3">{String(row[column] ?? "")}</td>)}</tr>)}
            {rows.length === 0 ? <tr><td className="px-4 py-6 text-center text-muted" colSpan={columns.length}>No records.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
