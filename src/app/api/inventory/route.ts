import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivityInTransaction } from "@/lib/activity";
import { handleError, json, parseBody, problem, shopScope, withAuth } from "@/lib/api";
import { stockAdjustmentSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "inventory");
    const products = await prisma.product.findMany({
      where: shopScope(user),
      include: { category: true },
      orderBy: { name: "asc" }
    });
    const movements = await prisma.stockMovement.findMany({
      where: shopScope(user),
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    const lowStock = products.filter((product) => product.currentStock <= product.lowStockAlert);
    return json({ products, movements, lowStock });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request, "inventory");
    const input = await parseBody(request, stockAdjustmentSchema);
    const product = await prisma.product.findFirst({ where: { id: input.productId, ...shopScope(user) } });
    if (!product) return problem("Product not found", 404);
    const delta = input.type === "STOCK_OUT" ? -Math.abs(input.quantity) : input.quantity;
    if (product.currentStock + delta < 0) return problem(`${product.name} does not have enough stock`, 422);
    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.product.update({ where: { id: product.id }, data: { currentStock: { increment: delta } } });
      await tx.stockMovement.create({
        data: { shopId: user.shopId!, productId: product.id, type: input.type, quantity: delta, note: input.note }
      });
      await recordActivityInTransaction(tx, {
        user,
        action: input.type,
        resource: "inventory",
        resourceId: product.id,
        message: `Adjusted stock for ${product.name}`,
        metadata: { productName: product.name, quantity: delta, note: input.note ?? null }
      });
      return item;
    });
    return json(updated);
  } catch (error) {
    return handleError(error);
  }
}
