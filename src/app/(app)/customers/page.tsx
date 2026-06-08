"use client";

import { ResourcePage } from "@/components/resource-page";

export default function CustomersPage() {
  return (
    <ResourcePage
      title="Customers"
      description="Manage retail customers and their purchase records."
      endpoint="/api/customers"
      fields={[
        { name: "name", label: "Customer name", required: true },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "address", label: "Address", type: "textarea" }
      ]}
      columns={[
        { key: "name", label: "Customer" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
        { key: "createdAt", label: "Added", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") }
      ]}
    />
  );
}
