"use client";

import { ResourcePage } from "@/components/resource-page";
import { dateTime } from "@/lib/format";

export default function ActivityPage() {
  return (
    <ResourcePage
      title="Activity"
      description="Review audit activity across records, invoices, stock, and settings."
      endpoint="/api/activity"
      allowCreate={false}
      fields={[]}
      emptyText="No activity has been recorded yet."
      columns={[
        { key: "createdAt", label: "Time", render: (row) => dateTime(row.createdAt) },
        { key: "user", label: "User", render: (row) => row.user?.name ?? "System" },
        { key: "action", label: "Action" },
        { key: "resource", label: "Resource" },
        { key: "message", label: "Details" }
      ]}
    />
  );
}
