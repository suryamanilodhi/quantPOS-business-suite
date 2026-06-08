import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { handleError, json, parseBody, problem, shopScope, withAuth } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { userSchema } from "@/lib/schemas";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const user = await withAuth(request, "users");
    const existing = await prisma.user.findFirst({ where: { id: context.params.id, ...shopScope(user) } });
    if (!existing) return problem("Not found", 404);
    const input = await parseBody(request, userSchema);
    const role = await prisma.role.upsert({ where: { name: input.role }, update: {}, create: { name: input.role } });
    const updated = await prisma.user.update({
      where: { id: context.params.id },
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        active: input.active,
        roleId: role.id,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {})
      },
      include: { role: true }
    });
    const { passwordHash, ...safe } = updated;
    await recordActivity({
      user,
      action: "UPDATE",
      resource: "users",
      resourceId: updated.id,
      message: `Updated staff user ${updated.name}`,
      metadata: { email: updated.email, role: input.role }
    });
    return json(safe);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const user = await withAuth(request, "users");
    const existing = await prisma.user.findFirst({ where: { id: context.params.id, ...shopScope(user) } });
    if (!existing) return problem("Not found", 404);
    if (existing.id === user.id) return problem("You cannot deactivate your own account", 422);
    await prisma.user.update({ where: { id: context.params.id }, data: { active: false } });
    await recordActivity({
      user,
      action: "DEACTIVATE",
      resource: "users",
      resourceId: existing.id,
      message: `Deactivated staff user ${existing.name}`,
      metadata: { email: existing.email }
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
