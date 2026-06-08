import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";
import { expenseSchema } from "@/lib/schemas";

const handlers = collectionHandlers(prisma.expense, expenseSchema, "expenses", {
  beforeCreate: (data, user) => ({ ...data, shopId: user.shopId, createdById: user.id })
});

export const GET = handlers.GET;
export const POST = handlers.POST;
