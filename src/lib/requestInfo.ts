import { NextRequest } from "next/server";

export function getRequestInfo(req: NextRequest): { ipAddress: string | null; userAgent: string | null } {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

  return {
    ipAddress,
    userAgent: req.headers.get("user-agent") || null,
  };
}
