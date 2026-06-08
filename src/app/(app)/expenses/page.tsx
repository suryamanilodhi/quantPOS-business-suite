"use client";

import { ResourcePage } from "@/components/resource-page";
import { money } from "@/lib/format";

export default function ExpensesPage() {
  return (
    <ResourcePage
      title="Expenses"
      description="Track operating costs by category and date."
      endpoint="/api/expenses"
      fields={[
        { name: "category", label: "Category", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "note", label: "Note", type: "textarea" }
      ]}
      columns={[
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", render: (row) => money(row.amount) },
        { key: "date", label: "Date", render: (row) => new Date(row.date).toLocaleDateString("en-IN") },
        { key: "note", label: "Note" }
      ]}
    />
  );
}
