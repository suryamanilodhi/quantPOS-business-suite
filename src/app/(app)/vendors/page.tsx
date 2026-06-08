"use client";

import { ResourcePage } from "@/components/resource-page";

export default function VendorsPage() {
  return (
    <ResourcePage
      title="Vendors"
      description="Maintain supplier profiles and purchase history."
      endpoint="/api/vendors"
      fields={[
        { name: "name", label: "Vendor name", required: true },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "gstNumber", label: "GST number" },
        { name: "address", label: "Address", type: "textarea" }
      ]}
      columns={[
        { key: "name", label: "Vendor" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "gstNumber", label: "GST" },
        { key: "createdAt", label: "Added", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") }
      ]}
    />
  );
}
