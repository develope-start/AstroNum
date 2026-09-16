import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACTION_TYPES, getValidActionToken } from "@/lib/actionTokens";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს"),
  confirmPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.password !== parsed.data.confirmPassword) return NextResponse.json({ error: "პაროლები ერთმანეთს არ ემთხვევა" }, { status: 400 });

  const actionToken = await getValidActionToken(parsed.data.token, ACTION_TYPES.PASSWORD_RESET);
  if (!actionToken || !actionToken.userId) return NextResponse.json({ error: "ბმული ვადაგასულია ან უკვე გამოყენებულია" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: actionToken.userId } });
  if (!user) return NextResponse.json({ error: "მომხმარებელი ვერ მოიძებნა" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    prisma.accountEvent.create({ data: { userId: user.id, type: "PASSWORD_RESET", emailSnapshot: user.email } }),
    prisma.actionToken.update({ where: { id: actionToken.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ message: "პაროლი წარმატებით აღდგა" });
}
