import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidPersonInput } from "@/lib/astro/inputSchemas";
import { calculateRectification } from "@/lib/astro/rectification";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireFeatureAccess } from "@/lib/billing/access";

const schema = z.object({
  birth: z.object({
    name: z.string().trim().min(1).max(120),
    date: z.string(),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    place: z.string().trim().min(1).max(200),
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    timezone: z.string().trim().min(1).max(64),
  }),
  uncertaintyMinutes: z.number().int().min(5).max(120),
  events: z.array(z.object({
    type: z.enum(["marriage", "child", "career", "relocation", "graduation", "crisis"]),
    date: z.string(),
  })).min(3).max(10),
});

export async function POST(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "chart:rectification"), 5, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "რექტიფიკაციის მოთხოვნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }
  const accessDenied = await requireFeatureAccess(req, "rectification");
  if (accessDenied) return accessDenied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია" }, { status: 400 });
  }
  if (!isValidPersonInput(parsed.data.birth)) {
    return NextResponse.json({ error: "დაბადების მონაცემები არასწორია" }, { status: 400 });
  }

  try {
    const result = calculateRectification(
      parsed.data.birth,
      parsed.data.events,
      parsed.data.uncertaintyMinutes,
    );
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "რექტიფიკაციის გამოთვლა ვერ შესრულდა" },
      { status: 400 },
    );
  }
}
