import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { handleError, json, parseBody, withAuth } from "@/lib/api";
import { settingsSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "settings");
    const shop = await prisma.shop.findUnique({ where: { id: user.shopId! }, include: { invoiceSetting: true } });
    return json(shop);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await withAuth(request, "settings");
    const input = await parseBody(request, settingsSchema);
    const shop = await prisma.shop.update({
      where: { id: user.shopId! },
      data: {
        name: input.name,
        gstNumber: input.gstNumber,
        address: input.address,
        phone: input.phone,
        currency: input.currency,
        invoiceSetting: {
          upsert: {
            create: { invoicePrefix: input.invoicePrefix, taxEnabled: input.taxEnabled, defaultTax: input.defaultTax },
            update: { invoicePrefix: input.invoicePrefix, taxEnabled: input.taxEnabled, defaultTax: input.defaultTax }
          }
        }
      },
      include: { invoiceSetting: true }
    });
    await recordActivity({
      user,
      action: "UPDATE",
      resource: "settings",
      resourceId: shop.id,
      message: "Updated shop settings",
      metadata: { shopName: shop.name, currency: shop.currency }
    });
    return json(shop);
  } catch (error) {
    return handleError(error);
  }
}
