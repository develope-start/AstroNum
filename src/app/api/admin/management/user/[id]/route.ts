import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { allocateAdminId, ensureAdminIds } from "@/lib/publicIds";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const emailSchema = z.object({
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

  const parsed = emailSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const nextRole = parsed.data.role ?? user.role;
  if (session.userId === params.id && nextRole !== "ADMIN") return NextResponse.json({ error: "The primary administrator role cannot be changed here" }, { status: 400 });
  const actor = await prisma.user.findUnique({ where: { id: session.userId }, select: { adminId: true } });
  if (nextRole !== user.role && actor?.adminId !== "ADMIN") return NextResponse.json({ error: "Only the primary administrator can change administrator roles" }, { status: 403 });
  const email = parsed.data.email.trim().toLowerCase();
  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate && duplicate.id !== user.id) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });

  const adminId = nextRole === "ADMIN"
    ? user.role === "ADMIN" ? user.adminId : await allocateAdminId()
    : null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { email, role: nextRole, adminId } }),
    prisma.accountEvent.create({ data: { userId: user.id, type: nextRole !== user.role ? "ADMIN_ROLE_CHANGED" : "ADMIN_EMAIL_CHANGED", emailSnapshot: email, oldEmail: user.email, newEmail: email } }),
  ]);
  return NextResponse.json({ message: "User email updated" });
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
        accountEventsJson: JSON.stringify(user.accountEvents),
      },
    }),
    prisma.accountEvent.deleteMany({ where: { userId: user.id } }),
    prisma.calculation.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return NextResponse.json({ message: "User moved to trash" });
}
