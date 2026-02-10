// lib/auth.ts
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

interface JwtPayload {
  userId: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * ตรวจสอบและถอดรหัส JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const raw = token.startsWith("Bearer ")
      ? token.slice(7)
      : token;

    const payload = jwt.verify(raw, JWT_SECRET) as JwtPayload;
    return payload;
  } catch (err) {
    console.error("JWT verify failed:", err);
    return null;
  }
}

/**
 * ดึง user จาก token (รองรับ cookie / bearer)
 * @param token string | undefined
 */
export async function getUserFromToken(
  token: string | undefined
): Promise<User | null> {
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}
