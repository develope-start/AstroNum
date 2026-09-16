import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACTION_TYPES, createActionToken } from "@/lib/actionTokens";
import { actionEmailHtml, getAppUrl, sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email("ელფოსტის ფორმატი არასწორია") });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: "თუ ანგარიში არსებობს, აღდგენის ბმული ელფოსტაზე გაიგზავნება" });

  const token = await createActionToken({ userId: user.id, type: ACTION_TYPES.PASSWORD_RESET, expiresInMinutes: 30 });
  const link = `${getAppUrl(req)}/cabinet/confirm?token=${encodeURIComponent(token)}&action=reset`;
  try {
    await sendEmail({
      to: user.email,
      subject: "პაროლის აღდგენა — ასტრო",
      html: actionEmailHtml("პაროლის აღდგენა", "მოითხოვეთ თქვენი კაბინეტის პაროლის აღდგენა.", link, "პაროლის აღდგენა"),
    });
  } catch (error) {
    console.error("Password reset email failed", error);
    return NextResponse.json({ error: "აღდგენის წერილის გაგზავნა ვერ მოხერხდა" }, { status: 503 });
  }

  return NextResponse.json({ message: "თუ ანგარიში არსებობს, აღდგენის ბმული ელფოსტაზე გაიგზავნა" });
}
