import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function DELETE(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "წასაშლელი ანგარიშები არ არის მონიშნული" }, { status: 400 });

  const result = await prisma.deletedUser.deleteMany({ where: { id: { in: parsed.data.ids } } });
  return NextResponse.json({ message: `სამუდამოდ წაიშალა ${result.count} ანგარიში` });
}
