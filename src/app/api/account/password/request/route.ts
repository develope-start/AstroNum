import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { ACTION_TYPES, createActionToken } from "@/lib/actionTokens";
import { actionEmailHtml, getAppUrl, sendEmail } from "@/lib/email";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "ახალი პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს"),
  confirmPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return NextResponse.json({ error: "ახალი პაროლები ერთმანეთს არ ემთხვევა" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "მიმდინარე პაროლი არასწორია" }, { status: 400 });
  }

  const token = await createActionToken({
    userId: user.id,
    type: ACTION_TYPES.PASSWORD_CHANGE,
    payload: { passwordHash: await hashPassword(parsed.data.newPassword) },
    expiresInMinutes: 60,
  });
  const link = `${getAppUrl(req)}/cabinet/confirm?token=${encodeURIComponent(token)}&action=password`;

  try {
    await sendEmail({
      to: user.email,
      subject: "დაადასტურეთ პაროლის ცვლილება — ასტრო",
      html: actionEmailHtml("პაროლის ცვლილების დადასტურება", "თქვენი კაბინეტის პაროლის შეცვლა მოითხოვეთ.", link, "პაროლის შეცვლის დადასტურება"),
    });
  } catch (error) {
    console.error("Password change confirmation failed", error);
    return NextResponse.json({ error: "დადასტურების წერილის გაგზავნა ვერ მოხერხდა" }, { status: 503 });
  }

  return NextResponse.json({ message: "დადასტურების ბმული თქვენს ელფოსტაზე გაიგზავნა" });
}
