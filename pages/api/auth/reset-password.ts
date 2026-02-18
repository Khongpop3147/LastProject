import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Missing token or password" });

  // ตรวจสอบความแข็งแรงของรหัสผ่าน
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
  }

  // หาตัว token ใน DB พร้อม user ที่เกี่ยวข้อง
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) return res.status(400).json({ error: "Token ไม่ถูกต้อง" });

  if (resetToken.expiresAt < new Date())
    return res.status(400).json({ error: "Token หมดอายุ" });

  // hash รหัสผ่านใหม่
  const hashed = await bcrypt.hash(newPassword, 10);

  // อัพเดตรหัสผ่าน user
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash: hashed },
  });

  // ลบ token ทิ้ง (one-time use)
  await prisma.passwordResetToken.delete({ where: { token } });

  res.status(200).json({ success: true });
}
