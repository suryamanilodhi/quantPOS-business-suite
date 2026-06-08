import { z } from "zod";

const optionalText = z.union([z.string(), z.null(), z.undefined()]).transform((value) => {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}).pipe(z.string().max(500, "Must be 500 characters or fewer").nullable());
const requiredText = (label: string, min = 2, max = 120) =>
  z.string({ required_error: `${label} is required` }).trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be ${max} characters or fewer`);
const money = z.coerce.number({ invalid_type_error: "Amount must be a number" }).min(0, "Amount cannot be negative").max(999999999, "Amount is too large");
const percent = z.coerce.number({ invalid_type_error: "Percent must be a number" }).min(0, "Percent cannot be negative").max(100, "Percent cannot be more than 100");
const positiveInt = (label: string) => z.coerce.number({ invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`).min(1, `${label} must be at least 1`);
const nonNegativeInt = (label: string) => z.coerce.number({ invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`).min(0, `${label} cannot be negative`);
const optionalEmail = z.union([z.string(), z.null(), z.undefined()]).transform((value) => {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}).pipe(z.string().email("Enter a valid email address").max(160, "Email must be 160 characters or fewer").nullable());

export const categorySchema = z.object({
  name: requiredText("Category name")
}).strict();

export const productSchema = z.object({
  name: requiredText("Product name"),
  sku: requiredText("SKU", 2, 80),
  barcode: optionalText,
  imageUrl: optionalText,
  unitType: z.enum(["PCS", "KG", "LITRE", "PACKET", "BOX"]),
  purchasePrice: money,
  sellingPrice: money,
  taxPercent: percent,
  openingStock: nonNegativeInt("Opening stock").default(0),
  currentStock: nonNegativeInt("Current stock").optional(),
  lowStockAlert: nonNegativeInt("Low stock alert"),
  categoryId: optionalText,
  categoryName: optionalText
}).strict();

export const vendorSchema = z.object({
  name: requiredText("Vendor name"),
  phone: optionalText,
  email: optionalEmail,
  gstNumber: optionalText,
  address: optionalText
}).strict();

export const customerSchema = z.object({
  name: requiredText("Customer name"),
  phone: optionalText,
  email: optionalEmail,
  address: optionalText
}).strict();

export const expenseSchema = z.object({
  category: requiredText("Expense category"),
  amount: money,
  date: z.coerce.date(),
  note: optionalText
}).strict();

export const userSchema = z.object({
  name: requiredText("Name"),
  email: z.string({ required_error: "Email is required" }).trim().email("Enter a valid email address").max(160, "Email must be 160 characters or fewer"),
  password: z.string().min(8).optional().or(z.literal("")),
  phone: optionalText,
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "INVENTORY_STAFF"]),
  active: z.coerce.boolean().default(true)
}).strict();

const lineItem = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: positiveInt("Quantity"),
  price: money,
  taxPercent: percent.default(0),
  discount: money.default(0)
}).strict().superRefine((item, context) => {
  const lineTotal = item.quantity * item.price;
  if (item.discount > lineTotal) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["discount"], message: "Discount cannot be more than the line total" });
  }
});

export const purchaseSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  items: z.array(lineItem).min(1)
}).strict();

export const saleSchema = z.object({
  customerId: optionalText,
  paymentMethod: z.enum(["CASH", "UPI", "CARD", "CREDIT"]),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("PAID"),
  discount: money.default(0),
  items: z.array(lineItem).min(1)
}).strict().superRefine((sale, context) => {
  const subtotal = sale.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  if (sale.discount > subtotal) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["discount"], message: "Invoice discount cannot be more than subtotal" });
  }
  if (sale.paymentMethod === "CREDIT" && sale.paymentStatus === "PAID") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentStatus"], message: "Credit sales cannot be marked paid" });
  }
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" }).int("Quantity must be a whole number"),
  note: optionalText
}).strict().superRefine((input, context) => {
  if (input.type === "ADJUSTMENT") {
    if (input.quantity === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Correction quantity cannot be zero" });
    return;
  }
  if (input.quantity <= 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Quantity must be at least 1" });
});

export const settingsSchema = z.object({
  name: requiredText("Business name"),
  gstNumber: optionalText,
  address: optionalText,
  phone: optionalText,
  currency: z.enum(["INR"]).default("INR"),
  invoicePrefix: requiredText("Invoice prefix", 1, 12).regex(/^[A-Za-z0-9-]+$/, "Invoice prefix can only contain letters, numbers, and hyphen"),
  taxEnabled: z.coerce.boolean(),
  defaultTax: percent
}).strict();
