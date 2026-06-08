import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, json, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request, "admin");
    return json(await prisma.subscriptionPlan.findMany({ orderBy: { priceInr: "asc" } }));
  } catch (error) {
    return handleError(error);
  }
}
