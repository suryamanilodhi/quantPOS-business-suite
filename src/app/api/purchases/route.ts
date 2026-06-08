import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivityInTransaction } from "@/lib/activity";
import { handleError, json, parseBody, problem, shopScope, withAuth } from "@/lib/api";
import { purchaseSchema } from "@/lib/schemas";

function totals(items: Array<{ quantity: number; price: number; taxPercent: number; discount: number }>) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);
  const taxTotal = items.reduce((sum, item) => sum + ((item.quantity * item.price - item.discount) * item.taxPercent) / 100, 0);
  return { subtotal, discountTotal, taxTotal, grandTotal: subtotal - discountTotal + taxTotal };
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "purchases");
    return json(await prisma.purchase.findMany({ where: shopScope(user), include: { vendor: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request, "purchases");
    const input = await parseBody(request, purchaseSchema);
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, ...shopScope(user) }, select: { id: true } });
    if (!vendor) return problem("Vendor not found", 404);
    const items = input.items.map((item) => ({
      ...item,
      taxPercent: item.taxPercent ?? 0,
      discount: item.discount ?? 0
    }));
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    if (productIds.length !== input.items.length) return problem("Each product can only appear once per purchase", 422);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true, ...shopScope(user) }, select: { id: true } });
    if (products.length !== productIds.length) return problem("One or more products were not found", 404);
    const summary = totals(items);
    const count = await prisma.purchase.count({ where: shopScope(user) });
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          invoiceNumber: `PUR-${String(count + 1).padStart(5, "0")}`,
          vendorId: input.vendorId,
          shopId: user.shopId!,
          createdById: user.id,
          paymentStatus: input.paymentStatus,
          ...summary,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.price,
              taxPercent: item.taxPercent,
              discount: item.discount,
              total: item.quantity * item.price - item.discount + ((item.quantity * item.price - item.discount) * item.taxPercent) / 100
            }))
          }
        },
        include: { vendor: true, items: { include: { product: true } } }
      });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: item.quantity }, purchasePrice: item.price } });
        await tx.stockMovement.create({ data: { shopId: user.shopId!, productId: item.productId, type: "PURCHASE", quantity: item.quantity, reference: created.invoiceNumber } });
      }
      await recordActivityInTransaction(tx, {
        user,
        action: "CREATE",
        resource: "purchases",
        resourceId: created.id,
        message: `Created purchase ${created.invoiceNumber}`,
        metadata: { invoiceNumber: created.invoiceNumber, grandTotal: summary.grandTotal, itemCount: items.length }
      });
      return created;
    });
    return json(purchase, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
