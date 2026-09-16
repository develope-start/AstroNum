import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { allocateAdminId, allocatePublicId, numberFromPublicId } from "@/lib/publicIds";

async function allowed(req: NextRequest) {
  return (await getActiveSessionFromRequest(req))?.role === "ADMIN";
}

function parseJsonArray(value: string): Array<Record<string, any>> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as Array<Record<string, any>> : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await allowed(req))) return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  const deleted = await prisma.deletedUser.findUnique({ where: { id: params.id } });
  if (!deleted) return NextResponse.json({ error: "ურნაში ჩანაწერი ვერ მოიძებნა" }, { status: 404 });
  if (deleted.role === "ADMIN" && deleted.adminId === "ADMIN") {
    return NextResponse.json({ error: "მთავარი ადმინისტრატორის წაშლილი კაბინეტის აღდგენა შეუძლებელია; რუკები ცალკე აღადგინეთ." }, { status: 409 });
  }
  if (await prisma.user.findUnique({ where: { email: deleted.email } })) return NextResponse.json({ error: "ამ ელფოსტით მოქმედი ანგარიში უკვე არსებობს" }, { status: 409 });

  const charts = parseJsonArray(deleted.chartsJson);
  const calculations = parseJsonArray(deleted.calculationsJson);
  const events = parseJsonArray(deleted.accountEventsJson);
  if (!charts || !calculations || !events) {
    return NextResponse.json({ error: "This deleted account contains invalid archive data and cannot be restored automatically" }, { status: 422 });
  }
  const restoredPublicId = await allocatePublicId("REGISTERED", numberFromPublicId(deleted.publicId));
  const restoredAdminId = deleted.role === "ADMIN" ? await allocateAdminId(deleted.adminId) : null;
  await prisma.$transaction(async (tx) => {
    await tx.user.create({ data: { id: deleted.id, publicId: restoredPublicId, adminId: restoredAdminId, name: deleted.name, username: deleted.username, email: deleted.email, passwordHash: deleted.passwordHash, role: deleted.role, createdAt: deleted.originalCreatedAt } });
    for (const chart of charts) {
      await tx.chart.create({ data: { ...chart, userId: deleted.id, createdAt: new Date(chart.createdAt as string) } as any });
    }
    for (const calculation of calculations) {
      const { interpretation: _interpretation, ...calculationData } = calculation;
      await tx.calculation.create({ data: { ...calculationData, userId: deleted.id, publicId: restoredPublicId, createdAt: new Date(calculation.createdAt as string) } as any });
    }
    for (const event of events) {
      await tx.accountEvent.create({ data: { ...event, userId: deleted.id, createdAt: new Date(event.createdAt as string) } as any });
    }
    await tx.accountEvent.create({
      data: {
        userId: deleted.id,
        type: "ACCOUNT_RESTORED",
        emailSnapshot: deleted.email,
      },
    });
    await tx.deletedUser.delete({ where: { id: deleted.id } });
  });
  return NextResponse.json({ message: "მომხმარებელი აღდგა" });
}
