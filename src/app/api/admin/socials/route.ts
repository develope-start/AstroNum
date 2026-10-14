import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { getSocialSettings, updateSocialSettings, SocialSettingsData } from "@/lib/socialSettings";

async function adminOnly(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  return session?.role === "ADMIN" ? null : NextResponse.json({ error: "წვდომა აკრძალულია." }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const denied = await adminOnly(req);
  if (denied) return denied;

  const socials = await getSocialSettings();
  return NextResponse.json({ success: true, socials }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest) {
  const denied = await adminOnly(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as Partial<SocialSettingsData>;
    const updated = await updateSocialSettings(body);
    return NextResponse.json({ success: true, socials: updated });
  } catch (error) {
    console.error("Failed to update social settings:", error);
    return NextResponse.json({ error: "პარამეტრების შენახვა ვერ მოხერხდა." }, { status: 500 });
  }
}
