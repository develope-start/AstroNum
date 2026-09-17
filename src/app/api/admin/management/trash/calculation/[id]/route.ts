import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { allocateMapNumber, allocatePublicId, ensureUserPublicId, numberFromPublicId } from "@/lib/publicIds";

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  const deleted = await prisma.deletedCalculation.findUnique({ where: { id: params.id } });
  if (!deleted) {
    return NextResponse.json({ error: "ურნაში ეს რუკა ვეღარ მოიძებნა" }, { status: 404 });
  }

  const calculation = parseJsonObject(deleted.dataJson);
  if (!calculation) {
    return NextResponse.json({ error: "This deleted calculation contains invalid archive data and cannot be restored automatically" }, { status: 422 });
  }
  const { interpretation: _interpretation, ownerEmail: _ownerEmail, ...calculationData } = calculation;
  const userId = typeof calculation.userId === "string" ? calculation.userId : null;
  let user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, publicId: true, email: true } })
    : null;
  if (!user && userId) {
    const deletedOwner = await prisma.deletedUser.findUnique({ where: { id: userId }, select: { email: true } });
    user = deletedOwner
      ? await prisma.user.findUnique({ where: { email: deletedOwner.email }, select: { id: true, publicId: true, email: true } })
      : null;
  }
  if (!user && typeof calculation.ownerEmail === "string") {
    user = await prisma.user.findUnique({ where: { email: calculation.ownerEmail }, select: { id: true, publicId: true, email: true } });
  }
  if (userId && !user) {
    calculation.userId = null;
  }
  const publicId = user
    ? user.publicId || await ensureUserPublicId(user.id)
    : await allocatePublicId("GUEST", numberFromPublicId(typeof calculation.publicId === "string" ? calculation.publicId : null));
  calculation.publicId = publicId;
  calculation.mapNumber = typeof calculation.mapNumber === "string" ? calculation.mapNumber : await allocateMapNumber();
  calculationData.userId = calculation.userId;
  calculationData.publicId = publicId;
  calculationData.mapNumber = calculation.mapNumber;

  await prisma.$transaction(async (tx) => {
    await tx.calculation.create({
      data: {
        ...(calculationData as any),
        id: deleted.originalId,
        userId: calculation.userId as string | null,
        createdAt: new Date(calculation.createdAt as string),
      },
    });
    if (user) {
      await tx.accountEvent.create({
        data: {
          userId: user.id,
          type: `CALCULATION_RESTORED:${deleted.originalId}`,
          emailSnapshot: user.email,
        },
      });
    }
    await tx.deletedCalculation.delete({ where: { id: deleted.id } });
  });

  return NextResponse.json({ message: "რუკა ურნიდან აღდგენილია" });
}
