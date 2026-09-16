import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "astro_session";
const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface ActiveSession extends SessionPayload {
  name: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): (SessionPayload & { exp?: number }) | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;

/** ბაზიდან წამოსული role ველი String ტიპისაა (SQLite/Postgres ორივეზე მუშაობს ერთნაირად) —
 *  ეს ფუნქცია უსაფრთხოდ ავიწროებს მას ცნობილ მნიშვნელობებამდე. */
export function asRole(role: string): "USER" | "ADMIN" {
  return role === "ADMIN" ? "ADMIN" : "USER";
}

export function getSessionFromRequest(req: NextRequest): (SessionPayload & { exp?: number }) | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** JWT-ის გარდა ამოწმებს, რომ ანგარიში ჯერ კიდევ არსებობს ბაზაში. */
export async function getActiveSessionFromRequest(req: NextRequest): Promise<ActiveSession | null> {
  const session = getSessionFromRequest(req);
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true, role: true, createdAt: true } });
    if (!user) return null;
    return {
      userId: session.userId,
      email: user.email,
      role: asRole(user.role),
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      expiresAt: session.exp ? new Date(session.exp * 1000).toISOString() : null,
    };
  } catch {
    // A database outage must not turn an ordinary chart calculation into a 500.
    // Returning null also prevents stale JWTs from authorizing protected actions.
    return null;
  }
}
