import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, hashPassword } from "@/lib/auth";
import { ensureAdminIds } from "@/lib/publicIds";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username").optional(),
  email: z.string().trim().email("Invalid email format").transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(8, "Password must contain at least 8 characters").optional(),
}).refine((value) => value.name !== undefined || value.username !== undefined || value.email !== undefined || value.password !== undefined, "No changes supplied");

async function primaryAdmin(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") return null;
  await ensureAdminIds();
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { adminId: true } });
  return user?.adminId === "ADMIN" ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await primaryAdmin(req);
  if (!session) return NextResponse.json({ error: "Only the primary administrator can manage administrators" }, { status: 403 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const admin = await prisma.user.findUnique({ where: { id: params.id } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
  const email = parsed.data.email;
  const username = parsed.data.username?.toLowerCase();
  if (email) {
    const duplicate = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (duplicate && duplicate.id !== admin.id) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  }
  if (username) {
    const duplicate = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (duplicate && duplicate.id !== admin.id) return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  }
  const data: { name?: string; email?: string; passwordHash?: string } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (username !== undefined) Object.assign(data, { username });
  if (email !== undefined) data.email = email;
  if (parsed.data.password !== undefined) data.passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: admin.id }, data }),
    prisma.accountEvent.create({ data: { userId: admin.id, type: "ADMIN_PROFILE_CHANGED", emailSnapshot: email ?? admin.email, oldEmail: admin.email, newEmail: email ?? admin.email } }),
  ]);
  return NextResponse.json({ message: "Administrator updated" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await primaryAdmin(req);
  if (!session) return NextResponse.json({ error: "Only the primary administrator can manage administrators" }, { status: 403 });
  if (session.userId === params.id) return NextResponse.json({ error: "The primary administrator cannot be deleted here" }, { status: 400 });

  const admin = await prisma.user.findUnique({
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
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.deletedUser.create({
      data: {
        id: admin.id,
        publicId: admin.publicId,
        adminId: admin.adminId,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        passwordHash: admin.passwordHash,
        role: admin.role,
        originalCreatedAt: admin.createdAt,
        chartsJson: JSON.stringify(admin.charts),
        calculationsJson: JSON.stringify(admin.calculations),
        accountEventsJson: JSON.stringify(admin.accountEvents),
      },
    }),
    prisma.accountEvent.deleteMany({ where: { userId: admin.id } }),
    prisma.calculation.deleteMany({ where: { userId: admin.id } }),
    prisma.user.delete({ where: { id: admin.id } }),
  ]);
  return NextResponse.json({ message: "Administrator moved to trash" });
}
