import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACTION_TYPES, consumeActionToken, getValidActionToken } from "@/lib/actionTokens";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(256, "Password is too long"),
  confirmPassword: z.string().min(1).max(256),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.password !== parsed.data.confirmPassword) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });

  const actionToken = await getValidActionToken(parsed.data.token, ACTION_TYPES.PASSWORD_RESET);
  if (!actionToken || !actionToken.userId) return NextResponse.json({ error: "The link is invalid or has already been used" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: actionToken.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const passwordHash = await hashPassword(parsed.data.password);
  const consumed = await prisma.$transaction(async (tx) => {
    if (!(await consumeActionToken(tx, actionToken.id))) return false;
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await tx.accountEvent.create({ data: { userId: user.id, type: "PASSWORD_RESET", emailSnapshot: user.email } });
    return true;
  });
  if (!consumed) return NextResponse.json({ error: "The link is invalid or has already been used" }, { status: 400 });
  return NextResponse.json({ message: "Password updated successfully" });
}
