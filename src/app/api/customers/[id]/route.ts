import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";
import { customerSchema } from "@/lib/schemas";

const handlers = itemHandlers(prisma.customer, customerSchema, "customers", { include: { sales: { orderBy: { createdAt: "desc" }, take: 10 } } });

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
