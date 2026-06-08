import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { Prisma } from "@prisma/client";
import { userFromApiRequest } from "@/lib/auth";
import { Permission, requirePermission } from "@/lib/permissions";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

type ApiProblem = {
  error: string;
  issues?: Array<{ path: string; message: string }>;
};

export function problem(message: string, status = 400, issues?: ApiProblem["issues"]) {
  return NextResponse.json({ error: message, ...(issues?.length ? { issues } : {}) }, { status });
}

export async function withAuth(request: NextRequest, permission: Permission) {
  const user = await userFromApiRequest(request);
  if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  requirePermission(user, permission);
  if (user.role !== "SUPER_ADMIN" && !user.shopId) {
    throw Object.assign(new Error("Shop is required"), { status: 403 });
  }
  return user;
}

export async function parseBody<T>(request: NextRequest, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 });
  }
  return schema.parse(body);
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const issues = error.errors.map((issue) => ({
      path: issue.path.length ? issue.path.join(".") : "body",
      message: issue.message
    }));
    return problem(issues[0]?.message ?? "Invalid input", 422, issues);
  }
  if (
    process.env.NODE_ENV === "development" &&
    error instanceof Error &&
    error.message.includes("Environment variable not found: DATABASE_URL")
  ) {
    return problem("Data storage is not configured. Add DATABASE_URL to .env, then run Prisma setup.", 500);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return problem("A record with this value already exists", 409);
    if (error.code === "P2003") return problem("Related record not found", 422);
    if (error.code === "P2025") return problem("Record not found", 404);
  }
  if (error instanceof Error && error.name === "ForbiddenError") return problem("Forbidden", 403);
  if (error instanceof Error && "status" in error) {
    return problem(error.message, Number((error as Error & { status: number }).status));
  }
  console.error(error);
  return problem("Something went wrong", 500);
}

export function shopScope(user: { role: string; shopId: string | null }) {
  return user.role === "SUPER_ADMIN" ? {} : { shopId: user.shopId! };
}
