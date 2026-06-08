"use client";

import Link from "next/link";
import { ResourcePage } from "@/components/resource-page";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";

export default function PurchasesPage() {
  return (
    <>
      <div className="flex justify-end">
        <Link href="/purchases/new"><Button>Create purchase</Button></Link>
      </div>
      <ResourcePage
        title="Purchases"
        description="Track vendor invoices, payment status, and stock intake."
        endpoint="/api/purchases"
        allowCreate={false}
        fields={[]}
        columns={[
          { key: "invoiceNumber", label: "Invoice" },
          { key: "vendor", label: "Vendor", render: (row) => row.vendor?.name },
          { key: "paymentStatus", label: "Payment" },
          { key: "grandTotal", label: "Total", render: (row) => money(row.grandTotal) },
          { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleString("en-IN") }
        ]}
      />
    </>
  );
}
