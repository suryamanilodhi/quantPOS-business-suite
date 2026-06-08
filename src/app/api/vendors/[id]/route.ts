import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";
import { vendorSchema } from "@/lib/schemas";

const handlers = itemHandlers(prisma.vendor, vendorSchema, "vendors", { include: { purchases: { orderBy: { createdAt: "desc" }, take: 10 } } });

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
