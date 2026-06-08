import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, json, shopScope, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  from: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().date()).optional()
}).strict().superRefine((query, context) => {
  if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "To date must be after from date" });
  }
});

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "reports");
    const input = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const from = input.from;
    const to = input.to;
    const createdAt = from || to ? { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } : undefined;
    const where = { ...shopScope(user), ...(createdAt ? { createdAt } : {}) };
    const [sales, purchases, expenses, products, customers, vendors] = await Promise.all([
      prisma.sale.findMany({ where, include: { items: { include: { product: true } }, customer: true } }),
      prisma.purchase.findMany({ where, include: { items: { include: { product: true } }, vendor: true } }),
      prisma.expense.findMany({ where: { ...shopScope(user), ...(createdAt ? { date: createdAt } : {}) } }),
      prisma.product.findMany({ where: shopScope(user), include: { category: true } }),
      prisma.customer.findMany({ where: shopScope(user) }),
      prisma.vendor.findMany({ where: shopScope(user) })
    ]);
    const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
    const purchaseTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.grandTotal), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const profit = sales.reduce((sum, sale) => {
      const itemProfit = sale.items.reduce((lineSum, item) => lineSum + (Number(item.sellingPrice) - Number(item.product.purchasePrice)) * item.quantity, 0);
      return sum + itemProfit;
    }, 0) - expenseTotal;
    return json({ sales, purchases, expenses, products, customers, vendors, summary: { salesTotal, purchaseTotal, expenseTotal, profit } });
  } catch (error) {
    return handleError(error);
  }
}
