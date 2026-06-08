"use client";

import Link from "next/link";
import { ResourcePage } from "@/components/resource-page";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";

export default function SalesPage() {
  return (
    <>
      <div className="flex justify-end">
        <Link href="/pos"><Button>Open POS</Button></Link>
      </div>
      <ResourcePage
        title="Sales"
        description="Review invoices, payment methods, customers, and totals."
        endpoint="/api/sales"
        allowCreate={false}
        fields={[]}
        columns={[
          { key: "invoiceNumber", label: "Invoice" },
          { key: "customer", label: "Customer", render: (row) => row.customer?.name ?? "Walk-in" },
          { key: "paymentMethod", label: "Method" },
          { key: "paymentStatus", label: "Status" },
          { key: "grandTotal", label: "Total", render: (row) => money(row.grandTotal) },
          { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleString("en-IN") }
        ]}
      />
    </>
  );
}
