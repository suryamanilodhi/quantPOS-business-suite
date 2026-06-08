import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";
import { productSchema } from "@/lib/schemas";

const handlers = collectionHandlers(prisma.product, productSchema, "products", {
  include: { category: true },
  beforeCreate: async (data, user) => {
    if (data.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, shopId: user.shopId }, select: { id: true } });
      if (!category) throw Object.assign(new Error("Category not found"), { status: 404 });
    }
    const categoryId = data.categoryName
      ? (await prisma.category.upsert({
          where: { shopId_name: { shopId: user.shopId, name: data.categoryName } },
          update: {},
          create: { shopId: user.shopId, name: data.categoryName }
        })).id
      : data.categoryId || null;
    const { categoryName, ...product } = data;
    return {
      ...product,
      categoryId,
      shopId: user.shopId,
      currentStock: data.currentStock ?? data.openingStock,
      stockMovements: {
        create: {
          shopId: user.shopId,
          type: "OPENING",
          quantity: data.currentStock ?? data.openingStock,
          note: "Opening stock"
        }
      }
    };
  }
});

export const GET = handlers.GET;
export const POST = handlers.POST;
