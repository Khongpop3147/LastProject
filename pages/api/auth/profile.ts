// pages/api/auth/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(getAuthHeader(req));
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  if (req.method === "PATCH") {
    const rawName = String(req.body?.name ?? "");
    const rawEmail = String(req.body?.email ?? "");
    const rawPassword = String(req.body?.newPassword ?? "");

    const nextName = rawName.trim();
    const nextEmail = normalizeEmail(rawEmail);
    const nextPassword = rawPassword.trim();

    if (!nextName && !nextEmail && !nextPassword) {
      return res.status(400).json({ error: "ไม่มีข้อมูลสำหรับอัปเดต" });
    }

    if (nextName && nextName.length < 2) {
      return res.status(400).json({ error: "ชื่อควรมีอย่างน้อย 2 ตัวอักษร" });
    }

    if (nextEmail && !isValidEmail(nextEmail)) {
      return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (nextPassword && nextPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร" });
    }

    const data: { name?: string; email?: string; passwordHash?: string } = {};
    if (nextName) data.name = nextName;
    if (nextEmail) data.email = nextEmail;
    if (nextPassword) {
      data.passwordHash = await bcrypt.hash(nextPassword, 10);
    }

    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data,
      });

      return res.status(200).json({
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
      }

      return res.status(500).json({ error: "ไม่สามารถอัปเดตข้อมูลได้" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
