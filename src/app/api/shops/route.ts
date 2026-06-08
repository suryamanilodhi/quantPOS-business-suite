import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, json, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request, "admin");
    const shops = await prisma.shop.findMany({
      include: { plan: true, users: { include: { role: true } } },
      orderBy: { createdAt: "desc" }
    });
    return json(shops);
  } catch (error) {
    return handleError(error);
  }
}
