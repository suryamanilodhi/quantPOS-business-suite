import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, json, parseBody, problem, withAuth } from "@/lib/api";

const schema = z.object({ active: z.coerce.boolean() }).strict();

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    await withAuth(request, "admin");
    const input = await parseBody(request, schema);
    const existing = await prisma.shop.findUnique({ where: { id: context.params.id }, select: { id: true } });
    if (!existing) return problem("Shop not found", 404);
    const shop = await prisma.shop.update({ where: { id: context.params.id }, data: { active: input.active } });
    return json(shop);
  } catch (error) {
    return handleError(error);
  }
}
