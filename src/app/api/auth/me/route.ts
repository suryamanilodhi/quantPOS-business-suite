import { NextRequest } from "next/server";
import { handleError, json, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request, "dashboard");
    return json({ user });
  } catch (error) {
    return handleError(error);
  }
}
