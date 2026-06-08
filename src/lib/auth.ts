import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "quantpos_token";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  shopId: string | null;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: RoleName;
  shopId: string | null;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return secret;
}

export function signSession(user: SessionUser) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, shopId: user.shopId },
    getSecret(),
    { expiresIn: `${SESSION_DAYS}d` }
  );
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export function tokenFromRequest(request: NextRequest) {
  return request.cookies.get(COOKIE_NAME)?.value;
}

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    shopId: user.shopId
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function userFromApiRequest(request: NextRequest) {
  const payload = verifyToken(tokenFromRequest(request));
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    shopId: user.shopId
  } satisfies SessionUser;
}
