// pages/api/auth/admin-login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieParts = [
    `token=${token}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${7 * 24 * 60 * 60}`,
    "SameSite=Lax",
  ];
  if (isProd) cookieParts.push("Secure");

  res.setHeader("Set-Cookie", cookieParts.join("; "));

  return res.status(200).json({ success: true });
}
