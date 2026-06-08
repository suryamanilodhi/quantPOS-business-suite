import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";
import { vendorSchema } from "@/lib/schemas";

const handlers = collectionHandlers(prisma.vendor, vendorSchema, "vendors");

export const GET = handlers.GET;
export const POST = handlers.POST;
