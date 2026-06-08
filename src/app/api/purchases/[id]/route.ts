import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, json, problem, shopScope, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const user = await withAuth(request, "purchases");
    const purchase = await prisma.purchase.findFirst({ where: { id: context.params.id, ...shopScope(user) }, include: { vendor: true, items: { include: { product: true } } } });
    if (!purchase) return problem("Not found", 404);
    return json(purchase);
  } catch (error) {
    return handleError(error);
  }
}
