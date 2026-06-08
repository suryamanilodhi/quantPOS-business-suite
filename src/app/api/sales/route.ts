import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivityInTransaction } from "@/lib/activity";
import { handleError, json, parseBody, problem, shopScope, withAuth } from "@/lib/api";
import { saleSchema } from "@/lib/schemas";

function totals(items: Array<{ quantity: number; price: number; taxPercent: number; discount: number }>, invoiceDiscount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const lineDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const discountTotal = lineDiscount + invoiceDiscount;
  const taxTotal = items.reduce((sum, item) => sum + ((item.quantity * item.price - item.discount) * item.taxPercent) / 100, 0);
  return { subtotal, discountTotal, taxTotal, grandTotal: subtotal - discountTotal + taxTotal };
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "sales");
    return json(await prisma.sale.findMany({ where: shopScope(user), include: { customer: true, cashier: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request, "sales");
    const input = await parseBody(request, saleSchema);
    if (input.customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: input.customerId, ...shopScope(user) }, select: { id: true } });
      if (!customer) return problem("Customer not found", 404);
    }
    const items = input.items.map((item) => ({
      ...item,
      taxPercent: item.taxPercent ?? 0,
      discount: item.discount ?? 0
    }));
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    if (productIds.length !== input.items.length) return problem("Each product can only appear once per sale", 422);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true, ...shopScope(user) } });
    for (const item of items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return problem("Product not found", 404);
      if (product.currentStock < item.quantity) return problem(`${product.name} has insufficient stock`, 422);
    }
    const summary = totals(items, input.discount ?? 0);
    const count = await prisma.sale.count({ where: shopScope(user) });
    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNumber: `SALE-${String(count + 1).padStart(5, "0")}`,
          customerId: input.customerId || null,
          shopId: user.shopId!,
          cashierId: user.id,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus,
          ...summary,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              sellingPrice: item.price,
              taxPercent: item.taxPercent,
              discount: item.discount,
              total: item.quantity * item.price - item.discount + ((item.quantity * item.price - item.discount) * item.taxPercent) / 100
            }))
          }
        },
        include: { customer: true, cashier: true, items: { include: { product: true } } }
      });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { currentStock: { decrement: item.quantity } } });
        await tx.stockMovement.create({ data: { shopId: user.shopId!, productId: item.productId, type: "SALE", quantity: -item.quantity, reference: created.invoiceNumber } });
      }
      await recordActivityInTransaction(tx, {
        user,
        action: "CREATE",
        resource: "sales",
        resourceId: created.id,
        message: `Created sale ${created.invoiceNumber}`,
        metadata: { invoiceNumber: created.invoiceNumber, grandTotal: summary.grandTotal, itemCount: items.length }
      });
      return created;
    });
    return json(sale, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
