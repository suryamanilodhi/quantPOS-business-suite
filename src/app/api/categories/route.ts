import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";
import { categorySchema } from "@/lib/schemas";

const handlers = collectionHandlers(prisma.category, categorySchema, "products");

export const GET = handlers.GET;
export const POST = handlers.POST;
