import bcrypt from "bcryptjs";
import { PrismaClient, RoleName, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );
  const roleByName = Object.fromEntries(roles.map((role) => [role.name, role]));

  const plan = await prisma.subscriptionPlan.upsert({
    where: { name: "Growth" },
    update: {},
    create: {
      name: "Growth",
      priceInr: 1499,
      staffLimit: 10,
      productLimit: 5000,
      features: ["POS billing", "Inventory", "Reports", "Staff roles"]
    }
  });

  const shop = await prisma.shop.upsert({
    where: { id: "demo-shop" },
    update: {
      name: "QuantPOS Retail Demo",
      gstNumber: "29ABCDE1234F1Z5",
      address: "MG Road, Bengaluru",
      phone: "+91 98765 43210",
      planId: plan.id,
      subscriptionStatus: "ACTIVE",
      invoiceSetting: {
        upsert: {
          create: {
            invoicePrefix: "QP",
            taxEnabled: true,
            defaultTax: 18,
            footerNote: "Thank you for shopping with us."
          },
          update: {
            invoicePrefix: "QP",
            taxEnabled: true,
            defaultTax: 18,
            footerNote: "Thank you for shopping with us."
          }
        }
      }
    },
    create: {
      id: "demo-shop",
      name: "QuantPOS Retail Demo",
      gstNumber: "29ABCDE1234F1Z5",
      address: "MG Road, Bengaluru",
      phone: "+91 98765 43210",
      planId: plan.id,
      subscriptionStatus: "ACTIVE",
      invoiceSetting: {
        create: {
          invoicePrefix: "QP",
          taxEnabled: true,
          defaultTax: 18,
          footerNote: "Thank you for shopping with us."
        }
      }
    }
  });

  const passwordHash = await bcrypt.hash("password123", 12);
  const users = [
    ["Super Admin", "superadmin@quantpos.test", RoleName.SUPER_ADMIN, null],
    ["Aarav Owner", "owner@quantpos.test", RoleName.OWNER, shop.id],
    ["Maya Manager", "manager@quantpos.test", RoleName.MANAGER, shop.id],
    ["Riya Cashier", "cashier@quantpos.test", RoleName.CASHIER, shop.id],
    ["Kabir Inventory", "inventory@quantpos.test", RoleName.INVENTORY_STAFF, shop.id]
  ] as const;

  for (const [name, email, roleName, shopId] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash,
        roleId: roleByName[roleName].id,
        shopId
      }
    });
  }

  const groceries = await prisma.category.upsert({
    where: { shopId_name: { shopId: shop.id, name: "Groceries" } },
    update: {},
    create: { name: "Groceries", shopId: shop.id }
  });
  const beverages = await prisma.category.upsert({
    where: { shopId_name: { shopId: shop.id, name: "Beverages" } },
    update: {},
    create: { name: "Beverages", shopId: shop.id }
  });

  const products = [
    ["Basmati Rice 5kg", "SKU-RICE-5KG", UnitType.KG, 420, 520, 18, 36, groceries.id],
    ["Sunflower Oil 1L", "SKU-OIL-1L", UnitType.LITRE, 115, 145, 5, 12, groceries.id],
    ["Masala Tea 250g", "SKU-TEA-250", UnitType.PACKET, 85, 120, 5, 7, beverages.id],
    ["Premium Soap Box", "SKU-SOAP-BOX", UnitType.BOX, 210, 275, 18, 4, groceries.id]
  ] as const;

  for (const [name, sku, unitType, purchasePrice, sellingPrice, taxPercent, currentStock, categoryId] of products) {
    await prisma.product.upsert({
      where: { shopId_sku: { shopId: shop.id, sku } },
      update: {},
      create: {
        name,
        sku,
        barcode: sku.replace("SKU-", "890"),
        unitType,
        purchasePrice,
        sellingPrice,
        taxPercent,
        openingStock: currentStock,
        currentStock,
        lowStockAlert: 8,
        categoryId,
        shopId: shop.id,
        stockMovements: {
          create: {
            shopId: shop.id,
            type: "OPENING",
            quantity: currentStock,
            note: "Seed opening stock"
          }
        }
      }
    });
  }

  await prisma.vendor.createMany({
    data: [
      { name: "City Wholesale", phone: "+91 90000 00001", email: "sales@citywholesale.test", gstNumber: "29AAACC1234A1Z9", address: "Peenya, Bengaluru", shopId: shop.id },
      { name: "FreshMart Distribution", phone: "+91 90000 00002", email: "hello@freshmart.test", address: "Yeshwanthpur, Bengaluru", shopId: shop.id }
    ],
    skipDuplicates: true
  });

  await prisma.customer.createMany({
    data: [
      { name: "Ananya Rao", phone: "+91 91111 11111", email: "ananya@example.com", address: "Indiranagar", shopId: shop.id },
      { name: "Vikram Shah", phone: "+91 92222 22222", email: "vikram@example.com", address: "Koramangala", shopId: shop.id }
    ],
    skipDuplicates: true
  });

  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "owner@quantpos.test" } });
  await prisma.expense.createMany({
    data: [
      { category: "Rent", amount: 35000, date: new Date(), note: "Monthly shop rent", shopId: shop.id, createdById: owner.id },
      { category: "Utilities", amount: 4200, date: new Date(), note: "Electricity bill", shopId: shop.id, createdById: owner.id }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
