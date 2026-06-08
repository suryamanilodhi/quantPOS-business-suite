import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, json, shopScope, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  action: z.string().trim().max(40).optional(),
  resource: z.enum(["admin", "dashboard", "users", "settings", "products", "inventory", "vendors", "customers", "purchases", "sales", "expenses", "reports", "activity"]).optional()
}).strict();

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "activity");
    const input = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const action = input.action?.trim();
    const resource = input.resource;
    const where = {
      ...shopScope(user),
      ...(action ? { action } : {}),
      ...(resource ? { resource } : {})
    };

    const activity = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 250
    });

    return json(activity);
  } catch (error) {
    return handleError(error);
  }
}
