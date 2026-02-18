import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  // Rate limit: 5 ครั้ง / 15 นาที ต่อ IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot-password:${ip}`, { limit: 5, windowSec: 15 * 60 });
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // ไม่บอกชัดว่าเมลไม่มีในระบบ เพื่อป้องกันการเจาะข้อมูล (security best practice)
    return res
      .status(200)
      .json({ message: "ถ้าพบอีเมลนี้ในระบบ จะส่งลิงก์รีเซ็ตรหัสผ่านไปให้" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 ชั่วโมง

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>คลิก <a href="${resetUrl}">ที่นี่</a> เพื่อรีเซ็ตรหัสผ่าน (ลิงก์นี้ใช้ได้ 1 ชั่วโมง)</p>`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    // ส่ง response success เพื่อไม่เปิดเผยว่าเกิดข้อผิดพลาดส่งเมล
  }

  return res
    .status(200)
    .json({ message: "ถ้าพบอีเมลนี้ในระบบ จะส่งลิงก์รีเซ็ตรหัสผ่านไปให้" });
}
