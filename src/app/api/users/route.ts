import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { handleError, json, parseBody, shopScope, withAuth } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { userSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "users");
    const users = await prisma.user.findMany({
      where: shopScope(user),
      include: { role: true, shop: true },
      orderBy: { createdAt: "desc" }
    });
    return json(users.map(({ passwordHash, ...safe }) => safe));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request, "users");
    const input = await parseBody(request, userSchema);
    const role = await prisma.role.upsert({ where: { name: input.role }, update: {}, create: { name: input.role } });
    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password || "password123"),
        phone: input.phone,
        active: input.active,
        roleId: role.id,
        shopId: user.role === "SUPER_ADMIN" ? null : user.shopId
      },
      include: { role: true }
    });
    const { passwordHash, ...safe } = created;
    await recordActivity({
      user,
      action: "CREATE",
      resource: "users",
      resourceId: created.id,
      message: `Created staff user ${created.name}`,
      metadata: { email: created.email, role: input.role }
    });
    return json(safe, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
