import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, verifyPassword } from "@/lib/auth";
import { ACTION_TYPES, createActionToken } from "@/lib/actionTokens";
import { actionEmailHtml, getAppUrl, sendEmail } from "@/lib/email";

const schema = z.object({ currentPassword: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "მიმდინარე პაროლი აუცილებელია" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "მიმდინარე პაროლი არასწორია" }, { status: 400 });
  }

  const token = await createActionToken({ userId: user.id, type: ACTION_TYPES.ACCOUNT_DELETE, expiresInMinutes: 30 });
  const link = `${getAppUrl(req)}/cabinet/confirm?token=${encodeURIComponent(token)}&action=delete`;

  try {
    await sendEmail({
      to: user.email,
      subject: "დაადასტურეთ კაბინეტის წაშლა — ასტრო",
      html: actionEmailHtml("კაბინეტის წაშლის დადასტურება", "თქვენი კაბინეტის წაშლა მოითხოვეთ. ეს მოქმედება შეუქცევადია.", link, "კაბინეტის წაშლა"),
    });
  } catch (error) {
    console.error("Account deletion confirmation failed", error);
    return NextResponse.json({ error: "დადასტურების წერილის გაგზავნა ვერ მოხერხდა" }, { status: 503 });
  }

  return NextResponse.json({ message: "წაშლის დადასტურების ბმული თქვენს ელფოსტაზე გაიგზავნა" });
}
