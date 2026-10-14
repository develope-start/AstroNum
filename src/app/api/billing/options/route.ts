import { NextResponse } from "next/server";
import { getBillingControls } from "@/lib/billing/settings";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { providers } = await getBillingControls();
    return NextResponse.json({ providers: providers.filter((provider) => provider.enabled).map(({ id, label }) => ({ id, label })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load payment options:", error);
    return NextResponse.json({ error: "გადახდის პარამეტრების ჩატვირთვა ვერ მოხერხდა." }, { status: 503 });
  }
}