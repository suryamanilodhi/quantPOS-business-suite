import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleError, parseBody } from "@/lib/api";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";

const schema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(120, "Name must be 120 characters or fewer"),
  email: z.string({ required_error: "Email is required" }).trim().email("Enter a valid email address").max(160, "Email must be 160 characters or fewer"),
  password: z.string({ required_error: "Password is required" }).min(8, "Password must be at least 8 characters").max(128, "Password must be 128 characters or fewer"),
  shopName: z.string({ required_error: "Business name is required" }).trim().min(2, "Business name must be at least 2 characters").max(120, "Business name must be 120 characters or fewer"),
  phone: z.string().trim().max(40, "Phone must be 40 characters or fewer").optional()
}).strict();

export async function POST(request: NextRequest) {
  try {
    const input = await parseBody(request, schema);
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.$transaction(async (tx) => {
      const ownerRole = await tx.role.upsert({ where: { name: RoleName.OWNER }, update: {}, create: { name: RoleName.OWNER } });
      const shop = await tx.shop.create({
        data: {
          name: input.shopName,
          phone: input.phone,
          invoiceSetting: { create: { invoicePrefix: "QP", taxEnabled: true, defaultTax: 18 } }
        }
      });
      return tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          phone: input.phone,
          shopId: shop.id,
          roleId: ownerRole.id
        },
        include: { role: true }
      });
    });
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, signSession({ id: user.id, name: user.name, email: user.email, role: user.role.name, shopId: user.shopId }));
    return response;
  } catch (error) {
    return handleError(error);
  }
}
