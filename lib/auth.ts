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
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;

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
  token: string | undefined,
): Promise<User | null> {
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}

/**
 * Extract token from request (supports both Authorization header and cookies)
 */
export function getTokenFromRequest(req: any): string | undefined {
  // Try Authorization header first
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }

  // Fallback to cookie
  if (typeof req.cookies?.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }

  return undefined;
}

/**
 * Get user from request (extracts token automatically)
 */
export async function getUserFromRequest(req: any): Promise<User | null> {
  const token = getTokenFromRequest(req);
  return getUserFromToken(token);
}
