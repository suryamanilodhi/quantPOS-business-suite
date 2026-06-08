"use client";

import { ResourcePage } from "@/components/resource-page";

export default function UsersPage() {
  return (
    <ResourcePage
      title="Staff"
      description="Add staff and assign role-based permissions for your shop."
      endpoint="/api/users"
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", hiddenOnEdit: true },
        { name: "phone", label: "Phone" },
        { name: "role", label: "Role", type: "select", required: true, defaultValue: (row) => row?.role?.name, options: [
          { label: "Owner", value: "OWNER" },
          { label: "Manager", value: "MANAGER" },
          { label: "Cashier", value: "CASHIER" },
          { label: "Inventory Staff", value: "INVENTORY_STAFF" }
        ] },
        { name: "active", label: "Active", type: "checkbox" }
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role", render: (row) => row.role?.name?.replaceAll("_", " ") },
        { key: "active", label: "Status", render: (row) => row.active ? "Active" : "Inactive" },
        { key: "createdAt", label: "Added", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") }
      ]}
    />
  );
}
