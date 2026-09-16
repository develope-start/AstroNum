import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE, asRole } from "@/lib/auth";
import { getRequestInfo } from "@/lib/requestInfo";
import { twelveHoursAgo } from "@/lib/calculationHistory";
import { allocatePublicId, numberFromPublicId } from "@/lib/publicIds";

const schema = z.object({
  name: z.string().trim().min(1, "სახელი სავალდებულოა").max(120),
  username: z.string().trim().min(3, "Username მინიმუმ 3 სიმბოლო უნდა იყოს").max(32).regex(/^[a-zA-Z0-9_.-]+$/, "Username-ში გამოიყენეთ მხოლოდ ლათინური ასოები, ციფრები, წერტილი, ტირე ან ქვედა ტირე"),
  email: z.string().email("ელფოსტის ფორმატი არასწორია"),
  password: z.string().min(8, "პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const username = parsed.data.username.trim().toLowerCase();
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "ამ ელფოსტით მომხმარებელი უკვე რეგისტრირებულია" }, { status: 409 });
  }
  if (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    return NextResponse.json({ error: "ეს username უკვე დაკავებულია" }, { status: 409 });
  }
  const deleted = await prisma.deletedUser.findUnique({ where: { email } });
  if (deleted) {
    return NextResponse.json({ error: "ეს ანგარიში წაშლილია და აღდგენამდე იგივე ელფოსტით რეგისტრაცია შეუძლებელია" }, { status: 409 });
  }
  const deletedUsername = await prisma.deletedUser.findFirst({ where: { username }, select: { id: true } });
  if (deletedUsername) {
    return NextResponse.json({ error: "ეს username წაშლილ ანგარიშს ეკუთვნის და აღდგენამდე ვერ გამოიყენება" }, { status: 409 });
  }

  const requestInfo = getRequestInfo(req);
  const recentGuestCalculation = requestInfo.ipAddress && requestInfo.userAgent
    ? await prisma.calculation.findFirst({
        where: { userId: null, ipAddress: requestInfo.ipAddress, userAgent: requestInfo.userAgent, createdAt: { gte: twelveHoursAgo() } },
        orderBy: { createdAt: "desc" },
        select: { publicId: true },
      })
    : null;
  const publicId = await allocatePublicId("REGISTERED", numberFromPublicId(recentGuestCalculation?.publicId));
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, username, email, passwordHash, role: "USER", publicId },
  });
  await prisma.accountEvent.create({
    data: { type: "ACCOUNT_CREATED", emailSnapshot: user.email, userId: user.id },
  });
  if (requestInfo.ipAddress && requestInfo.userAgent) {
    await prisma.calculation.updateMany({
      where: {
        userId: null,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        createdAt: { gte: twelveHoursAgo() },
      },
      data: { userId: user.id, publicId },
    });
  }

  const token = signSession({ userId: user.id, email: user.email, role: asRole(user.role) });
  const res = NextResponse.json({ id: user.id, name: user.name, username: user.username, email: user.email, role: asRole(user.role) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
