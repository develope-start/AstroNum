import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, verifyPassword } from "@/lib/auth";
import { ACTION_TYPES, createActionToken } from "@/lib/actionTokens";
import { actionEmailHtml, getAppUrl, sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("ელფოსტის ფორმატი არასწორია"),
  currentPassword: z.string().min(1, "მიმდინარე პაროლი აუცილებელია"),
});

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "მიმდინარე პაროლი არასწორია" }, { status: 400 });
  }

  const newEmail = parsed.data.email.trim().toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: "ახალი ელფოსტა მიმდინარე ელფოსტისგან განსხვავებული უნდა იყოს" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) return NextResponse.json({ error: "ამ ელფოსტით ანგარიში უკვე არსებობს" }, { status: 409 });

  const token = await createActionToken({
    userId: user.id,
    type: ACTION_TYPES.EMAIL_CHANGE,
    payload: { newEmail },
    expiresInMinutes: 60,
  });
  const link = `${getAppUrl(req)}/cabinet/confirm?token=${encodeURIComponent(token)}&action=email`;

  try {
    await sendEmail({
      to: newEmail,
      subject: "დაადასტურეთ ელფოსტის ცვლილება — ასტრო",
      html: actionEmailHtml("ელფოსტის ცვლილების დადასტურება", "თქვენი კაბინეტისთვის ელფოსტის შეცვლა მოითხოვეთ.", link, "ელფოსტის დადასტურება"),
    });
  } catch (error) {
    console.error("Email change confirmation failed", error);
    return NextResponse.json({ error: "დადასტურების წერილის გაგზავნა ვერ მოხერხდა" }, { status: 503 });
  }

  return NextResponse.json({ message: "დადასტურების ბმული ახალ ელფოსტაზე გაიგზავნა" });
}
