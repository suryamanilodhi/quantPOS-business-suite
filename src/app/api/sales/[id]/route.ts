import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, json, problem, shopScope, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const user = await withAuth(request, "sales");
    const sale = await prisma.sale.findFirst({ where: { id: context.params.id, ...shopScope(user) }, include: { customer: true, cashier: true, items: { include: { product: true } } } });
    if (!sale) return problem("Not found", 404);
    return json(sale);
  } catch (error) {
    return handleError(error);
  }
}
