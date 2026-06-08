import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, parseBody, problem } from "@/lib/api";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string({ required_error: "Email is required" }).trim().email("Enter a valid email address"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required")
}).strict();

export async function POST(request: NextRequest) {
  try {
    const input = await parseBody(request, schema);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { role: true, shop: true } });
    if (!user || !user.active || !(await verifyPassword(input.password, user.passwordHash))) return problem("Invalid email or password", 401);
    if (user.shop && !user.shop.active) return problem("This shop is deactivated", 403);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, signSession({ id: user.id, name: user.name, email: user.email, role: user.role.name, shopId: user.shopId }));
    return response;
  } catch (error) {
    return handleError(error);
  }
}
