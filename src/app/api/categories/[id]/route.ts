import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";
import { categorySchema } from "@/lib/schemas";

const handlers = itemHandlers(prisma.category, categorySchema, "products");

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
