import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "designToggleAllowed" },
    });
    // Default is true if setting doesn't exist
    const allowed = setting ? setting.value === "true" : true;
    return NextResponse.json({ allowed });
  } catch (error) {
    return NextResponse.json({ allowed: true });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია — მხოლოდ ადმინისთვის" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.allowed !== "boolean") {
    return NextResponse.json({ error: "არასწორი პარამეტრი" }, { status: 400 });
  }

  const allowed = body.allowed;

  await prisma.systemSetting.upsert({
    where: { key: "designToggleAllowed" },
    create: { key: "designToggleAllowed", value: String(allowed) },
    update: { value: String(allowed) },
  });

  return NextResponse.json({ allowed });
}
