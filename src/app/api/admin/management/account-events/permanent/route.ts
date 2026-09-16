import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });

function parseEvents(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "მონიშნეთ ისტორიის მინიმუმ ერთი ჩანაწერი" }, { status: 400 });
  }

  const ids = [...new Set(parsed.data.ids)];
  const result = await prisma.$transaction(async (tx) => {
    const archivedUsers = await tx.deletedUser.findMany({
      select: { id: true, accountEventsJson: true },
    });

    for (const archivedUser of archivedUsers) {
      const events = parseEvents(archivedUser.accountEventsJson);
      const filteredEvents = events.filter((event) => {
        if (!event || typeof event !== "object" || !("id" in event)) return true;
        return !ids.includes(String((event as { id?: unknown }).id));
      });

      if (filteredEvents.length !== events.length) {
        await tx.deletedUser.update({
          where: { id: archivedUser.id },
          data: { accountEventsJson: JSON.stringify(filteredEvents) },
        });
      }
    }

    return tx.accountEvent.deleteMany({ where: { id: { in: ids } } });
  });

  return NextResponse.json({
    message: `სამუდამოდ წაიშალა ${result.count} ისტორიის ჩანაწერი`,
    count: result.count,
  });
}
