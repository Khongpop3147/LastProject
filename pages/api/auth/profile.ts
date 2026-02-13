import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req.headers.authorization);
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
    try {
      const { name, email, password } = req.body as {
        name?: string;
        email?: string;
        password?: string;
      };

      const updates: { name?: string; email?: string; passwordHash?: string } = {};

      if (typeof name === "string" && name.trim()) {
        updates.name = name.trim();
      }

      if (typeof email === "string" && email.trim()) {
        const nextEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: nextEmail } });
        if (existing && existing.id !== user.id) {
          return res.status(400).json({ error: "Email already in use" });
        }
        updates.email = nextEmail;
      }

      if (typeof password === "string" && password.trim()) {
        if (password.trim().length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        updates.passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No changes provided" });
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      return res.status(200).json({
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
