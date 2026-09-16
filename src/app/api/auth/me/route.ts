import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionFromRequest, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) {
    const response = NextResponse.json({ user: null });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  return NextResponse.json({ user: session });
}
