import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { allocateAdminId, ensureAdminIds } from "@/lib/publicIds";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const userEditSchema = z.object({
  name: z.string().trim().max(120).nullable().optional(),
  username: z.string().trim().max(32).regex(/^[a-zA-Z0-9_.-]*$/, "Username-ში გამოიყენეთ მხოლოდ ლათინური ასოები, ციფრები, წერტილი, ტირე ან ქვედა ტირე").refine((value) => !value || value.length >= 3, "Username მინიმუმ 3 სიმბოლო უნდა იყოს").nullable().optional(),
  email: z.string().email("Invalid email format"),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

async function isAdmin(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  return session && session.role === "ADMIN" ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  await ensureAdminIds();

  const parsed = userEditSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const nextRole = parsed.data.role ?? user.role;
  if (session.userId === params.id && nextRole !== "ADMIN") return NextResponse.json({ error: "The primary administrator role cannot be changed here" }, { status: 400 });
  const actor = await prisma.user.findUnique({ where: { id: session.userId }, select: { adminId: true } });
  if (nextRole !== user.role && actor?.adminId !== "ADMIN") return NextResponse.json({ error: "Only the primary administrator can change administrator roles" }, { status: 403 });
  const name = parsed.data.name === undefined ? user.name : parsed.data.name?.trim() || null;
  const username = parsed.data.username === undefined ? user.username : parsed.data.username?.trim().toLowerCase() || null;
  const email = parsed.data.email.trim().toLowerCase();
  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate && duplicate.id !== user.id) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  if (email !== user.email && await prisma.deletedUser.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "ეს მეილი წაშლილ ანგარიშს ეკუთვნის და აღდგენამდე ვერ გამოიყენება" }, { status: 409 });
  }
  if (username) {
    const duplicateUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (duplicateUsername && duplicateUsername.id !== user.id) return NextResponse.json({ error: "ეს username უკვე დაკავებულია" }, { status: 409 });
    const deletedUsername = await prisma.deletedUser.findFirst({ where: { username }, select: { id: true } });
    if (deletedUsername) return NextResponse.json({ error: "ეს username წაშლილ ანგარიშს ეკუთვნის და აღდგენამდე ვერ გამოიყენება" }, { status: 409 });
  }
  const nameChanged = name !== user.name;
  const usernameChanged = username !== user.username;
  const emailChanged = email !== user.email;

  const adminId = nextRole === "ADMIN"
    ? user.role === "ADMIN" ? user.adminId : await allocateAdminId()
    : null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name, username, email, role: nextRole, adminId } }),
    prisma.accountEvent.create({ data: { userId: user.id, type: nextRole !== user.role ? "ADMIN_ROLE_CHANGED" : [nameChanged, usernameChanged, emailChanged].filter(Boolean).length > 1 ? "PROFILE_CHANGED" : nameChanged ? "NAME_CHANGED" : usernameChanged ? "USERNAME_CHANGED" : "ADMIN_EMAIL_CHANGED", emailSnapshot: email, oldEmail: user.email, newEmail: email } }),
  ]);
  return NextResponse.json({ message: "User profile updated" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  await ensureAdminIds();
  if (session.userId === params.id) return NextResponse.json({ error: "The administrator account cannot be deleted here" }, { status: 400 });
  const actor = await prisma.user.findUnique({ where: { id: session.userId }, select: { adminId: true } });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      publicId: true,
      adminId: true,
      name: true,
      username: true,
      email: true,
      passwordHash: true,
      role: true,
      createdAt: true,
      charts: true,
      calculations: { select: calculationWithoutInterpretationSelect },
      accountEvents: true,
    },
  });
  if (user?.role === "ADMIN" && actor?.adminId !== "ADMIN") return NextResponse.json({ error: "Only the primary administrator can delete an administrator" }, { status: 403 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const chartCount = user.charts.length;
  const deletedChartEvent = user.accountEvents.some((event) => event.type.startsWith("CHART_DELETED"));
  const deletionType = chartCount > 0 || deletedChartEvent || user.calculations.length > 0
    ? "ACCOUNT_AND_CHARTS_DELETED"
    : "ACCOUNT_DELETED";

  const deletionEvent = {
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    type: deletionType,
    emailSnapshot: user.email,
    oldEmail: null,
    newEmail: null,
    createdAt: new Date().toISOString(),
  };
  const finalAccountEvents = [...user.accountEvents, deletionEvent];

  await prisma.$transaction([
    prisma.deletedUser.create({
      data: {
        id: user.id,
        publicId: user.publicId,
        adminId: user.adminId,
        name: user.name,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        originalCreatedAt: user.createdAt,
        chartsJson: JSON.stringify(user.charts),
        calculationsJson: JSON.stringify(user.calculations),
        accountEventsJson: JSON.stringify(finalAccountEvents),
      },
    }),
    prisma.accountEvent.deleteMany({ where: { userId: user.id } }),
    prisma.calculation.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return NextResponse.json({ message: "User moved to trash" });
}
