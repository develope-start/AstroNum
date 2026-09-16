import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, hashPassword } from "@/lib/auth";
import { allocateAdminId, allocatePublicId, ensureAdminIds } from "@/lib/publicIds";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username"),
  email: z.string().trim().email("Invalid email format").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});

async function primaryAdmin(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") return null;
  await ensureAdminIds();
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { adminId: true } });
  return user?.adminId === "ADMIN" ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await primaryAdmin(req))) return NextResponse.json({ error: "Only the primary administrator can manage administrators" }, { status: 403 });
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ createdAt: "asc" }, { adminId: "asc" }],
    select: { id: true, adminId: true, name: true, username: true, email: true, createdAt: true, _count: { select: { calculations: true } } },
  });
  return NextResponse.json({ admins: admins.map(({ _count, ...admin }) => ({ ...admin, calculationCount: _count.calculations })) });
}

export async function POST(req: NextRequest) {
  if (!(await primaryAdmin(req))) return NextResponse.json({ error: "Only the primary administrator can manage administrators" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { name, username, email, password } = parsed.data;
  const normalizedUsername = username.toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  if (await prisma.user.findUnique({ where: { username: normalizedUsername }, select: { id: true } })) return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  if (await prisma.deletedUser.findUnique({ where: { email }, select: { id: true } })) return NextResponse.json({ error: "This email is in the trash and must be restored first" }, { status: 409 });
  if (await prisma.deletedUser.findFirst({ where: { username: normalizedUsername }, select: { id: true } })) return NextResponse.json({ error: "This username belongs to a deleted account" }, { status: 409 });

  const adminId = await allocateAdminId();
  const publicId = await allocatePublicId("REGISTERED");
  const passwordHash = await hashPassword(password);
  const admin = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, username: normalizedUsername, email, passwordHash, role: "ADMIN", adminId, publicId } });
    await tx.accountEvent.create({ data: { userId: created.id, type: "ADMIN_CREATED", emailSnapshot: email } });
    return created;
  });
  return NextResponse.json({ id: admin.id, adminId: admin.adminId, name: admin.name, username: admin.username, email: admin.email, createdAt: admin.createdAt }, { status: 201 });
}
