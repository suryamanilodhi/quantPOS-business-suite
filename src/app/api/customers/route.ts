import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";
import { customerSchema } from "@/lib/schemas";

const handlers = collectionHandlers(prisma.customer, customerSchema, "customers");

export const GET = handlers.GET;
export const POST = handlers.POST;
