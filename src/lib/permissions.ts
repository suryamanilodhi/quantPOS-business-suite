import { RoleName } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";

export type Permission =
  | "admin"
  | "dashboard"
  | "users"
  | "settings"
  | "products"
  | "inventory"
  | "vendors"
  | "customers"
  | "purchases"
  | "sales"
  | "expenses"
  | "reports"
  | "activity";

const rolePermissions: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: ["admin", "dashboard", "users", "settings", "reports", "activity"],
  OWNER: ["dashboard", "users", "settings", "products", "inventory", "vendors", "customers", "purchases", "sales", "expenses", "reports", "activity"],
  MANAGER: ["dashboard", "products", "inventory", "vendors", "customers", "purchases", "sales", "reports", "activity"],
  CASHIER: ["dashboard", "customers", "sales"],
  INVENTORY_STAFF: ["dashboard", "products", "inventory", "vendors", "purchases"]
};

export function can(user: SessionUser, permission: Permission) {
  return rolePermissions[user.role].includes(permission);
}

export function requirePermission(user: SessionUser, permission: Permission) {
  if (!can(user, permission)) {
    const error = new Error("Forbidden");
    error.name = "ForbiddenError";
    throw error;
  }
}

export const navItems: Array<{ href: string; label: string; permission: Permission }> = [
  { href: "/dashboard", label: "Dashboard", permission: "dashboard" },
  { href: "/users", label: "Staff", permission: "users" },
  { href: "/master-data", label: "Master Data", permission: "products" },
  { href: "/products", label: "Products", permission: "products" },
  { href: "/inventory", label: "Inventory", permission: "inventory" },
  { href: "/vendors", label: "Vendors", permission: "vendors" },
  { href: "/customers", label: "Customers", permission: "customers" },
  { href: "/purchases", label: "Purchases", permission: "purchases" },
  { href: "/sales", label: "Sales", permission: "sales" },
  { href: "/pos", label: "POS", permission: "sales" },
  { href: "/expenses", label: "Expenses", permission: "expenses" },
  { href: "/reports", label: "Reports", permission: "reports" },
  { href: "/activity", label: "Activity", permission: "activity" },
  { href: "/settings", label: "Settings", permission: "settings" },
  { href: "/admin", label: "Super Admin", permission: "admin" }
];
