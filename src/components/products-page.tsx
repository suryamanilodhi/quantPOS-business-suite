"use client";

import { useEffect, useState } from "react";
import { ResourcePage } from "@/components/resource-page";
import { money } from "@/lib/format";

export function ProductsPage({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.ok ? response.json() : [])
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <ResourcePage
      title="Products"
      description="Add products with simple fields, saved categories, prices, tax, and stock alerts."
      endpoint="/api/products"
      initiallyOpen={initiallyOpen}
      createLabel="Add product"
      fields={[
        { name: "name", label: "Product name", required: true },
        {
          name: "categoryId",
          label: "Category",
          type: "select",
          defaultValue: (row) => row?.categoryId ?? "",
          options: [
            { label: "Select category", value: "" },
            ...categories.map((category) => ({ label: category.name, value: category.id }))
          ]
        },
        { name: "sku", label: "SKU", required: true },
        { name: "barcode", label: "Barcode" },
        { name: "unitType", label: "Unit", type: "select", required: true, options: ["PCS", "KG", "LITRE", "PACKET", "BOX"].map((value) => ({ label: value, value })) },
        { name: "purchasePrice", label: "Purchase price", type: "number", required: true },
        { name: "sellingPrice", label: "Selling price", type: "number", required: true },
        { name: "taxPercent", label: "Tax %", type: "number", required: true },
        { name: "openingStock", label: "Opening stock", type: "number" },
        { name: "lowStockAlert", label: "Low stock alert", type: "number", required: true }
      ]}
      columns={[
        { key: "name", label: "Product" },
        { key: "category", label: "Category", render: (row) => row.category?.name ?? "Uncategorized" },
        { key: "sku", label: "SKU" },
        { key: "unitType", label: "Unit" },
        { key: "currentStock", label: "Stock", render: (row) => <span className={row.currentStock <= row.lowStockAlert ? "font-semibold text-warning" : ""}>{row.currentStock}</span> },
        { key: "sellingPrice", label: "Selling price", render: (row) => money(row.sellingPrice) },
        { key: "taxPercent", label: "Tax", render: (row) => `${row.taxPercent}%` }
      ]}
      emptyText="Add your first product. Create categories once from Master Data, then select them here."
    />
  );
}
