"use client";

import { ResourcePage } from "@/components/resource-page";

export function MasterDataPage() {
  return (
    <ResourcePage
      title="Master Data"
      description="Create reusable values once. Product categories saved here appear as dropdown choices while adding products."
      endpoint="/api/categories"
      createLabel="Add category"
      fields={[
        { name: "name", label: "Category name", required: true }
      ]}
      columns={[
        { key: "name", label: "Category" },
        { key: "createdAt", label: "Created", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") }
      ]}
      emptyText="No categories yet. Add your first category here, then use it in Product add."
    />
  );
}
