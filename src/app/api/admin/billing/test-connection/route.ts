import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { verifyBogConnection } from "@/lib/billing/bog";
import { verifyTbcConnection } from "@/lib/billing/tbc";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const schema = z.object({ provider: z.enum(["BOG", "TBC"]) }).strict();

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია." }, { status: 403 });
  }

  const limiter = rateLimit(getRateLimitKey(req, "admin:billing:connection-test", session.userId), 3, 5 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "კავშირის შემოწმების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "მიუთითეთ სწორი გადახდის პროვაიდერი." }, { status: 400 });
  }

  try {
    if (parsed.data.provider === "BOG") {
      const result = await verifyBogConnection();
      return NextResponse.json({ provider: "BOG", connected: true, environment: result.environment });
    }
    await verifyTbcConnection();
    return NextResponse.json({ provider: "TBC", connected: true });
  } catch (error) {
    console.error(`${parsed.data.provider} connection check failed:`, error);
    return NextResponse.json(
      { error: "ბანკთან ავტორიზაცია ვერ დადასტურდა. გადაამოწმეთ სერვერზე credentials და ბანკის გარემო." },
      { status: 502 },
    );
  }
}
