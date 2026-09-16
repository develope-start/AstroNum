import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE, asRole, isConfiguredPrimaryAdminCredentials, syncConfiguredPrimaryAdmin } from "@/lib/auth";
import { getRequestInfo } from "@/lib/requestInfo";
import { twelveHoursAgo } from "@/lib/calculationHistory";
import { allocatePublicId, ensureAdminIds, ensureUserPublicId } from "@/lib/publicIds";

const schema = z.object({
  identifier: z.string().min(1).optional(),
  email: z.string().optional(),
  password: z.string().min(1),
}).refine((value) => Boolean(value.identifier?.trim() || value.email?.trim()), "Username ან ელფოსტა სავალდებულოა");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ელფოსტა და პაროლი სავალდებულოა" }, { status: 400 });
  }
  const { password } = parsed.data;
  const identifier = (parsed.data.identifier ?? parsed.data.email ?? "").trim();
  const normalizedIdentifier = identifier.toLowerCase();

  const isPrimaryRecovery = identifier.includes("@") && isConfiguredPrimaryAdminCredentials(normalizedIdentifier, password);
  let user = identifier.includes("@")
    ? await prisma.user.findUnique({ where: { email: normalizedIdentifier } })
    : await prisma.user.findUnique({ where: { username: normalizedIdentifier } });

  if (!user && isPrimaryRecovery) {
    const deleted = await prisma.deletedUser.findUnique({ where: { email: normalizedIdentifier } });
    const deletedUsername = deleted?.username
      ? await prisma.user.findUnique({ where: { username: deleted.username }, select: { id: true } })
      : null;
    const publicId = await allocatePublicId("REGISTERED");
    user = await prisma.user.create({
      data: {
        name: deleted?.name ?? "მთავარი ადმინისტრატორი",
        username: deletedUsername ? null : deleted?.username ?? null,
        email: normalizedIdentifier,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        adminId: "ADMIN",
        publicId,
      },
    });
    await prisma.accountEvent.create({ data: { userId: user.id, type: "PRIMARY_ADMIN_RECOVERED", emailSnapshot: user.email } });
  }

  if (!user || (!isPrimaryRecovery && !(await verifyPassword(password, user.passwordHash)))) {
    return NextResponse.json({ error: "ელფოსტა ან პაროლი არასწორია" }, { status: 401 });
  }

  if (isPrimaryRecovery) {
    const recoveredPasswordHash = await hashPassword(password);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: recoveredPasswordHash, role: "ADMIN", adminId: "ADMIN" },
    });
  } else if (isConfiguredPrimaryAdminCredentials(user.email, password)) {
    const syncedUser = await syncConfiguredPrimaryAdmin(user);
    user.role = syncedUser.role;
    user.adminId = syncedUser.adminId ?? null;
  }
  await ensureAdminIds();

  const publicId = await ensureUserPublicId(user.id);
  const requestInfo = getRequestInfo(req);
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
