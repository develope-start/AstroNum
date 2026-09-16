import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export const ACTION_TYPES = {
  EMAIL_CHANGE: "EMAIL_CHANGE",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",
  ACCOUNT_DELETE: "ACCOUNT_DELETE",
} as const;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createActionToken({
  userId,
  type,
  payload,
  expiresInMinutes,
}: {
  userId?: string;
  type: string;
  payload?: Record<string, string>;
  expiresInMinutes: number;
}): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.actionToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      payload: payload ? JSON.stringify(payload) : null,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
  });
  return token;
}

export async function getValidActionToken(token: string, type?: string) {
  const actionToken = await prisma.actionToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!actionToken || actionToken.usedAt || actionToken.expiresAt.getTime() <= Date.now()) return null;
  if (type && actionToken.type !== type) return null;
  return actionToken;
}

export function parseTokenPayload(payload: string | null): Record<string, string> {
  if (!payload) return {};
  try {
    return JSON.parse(payload) as Record<string, string>;
  } catch {
    return {};
  }
}
