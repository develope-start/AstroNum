import { NextResponse } from "next/server";
import { getSocialSettings } from "@/lib/socialSettings";

export async function GET() {
  const settings = await getSocialSettings();
  return NextResponse.json({ success: true, socials: settings });
}
