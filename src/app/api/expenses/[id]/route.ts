import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";
import { expenseSchema } from "@/lib/schemas";

const handlers = itemHandlers(prisma.expense, expenseSchema, "expenses");

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
