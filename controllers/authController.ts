// controllers/authController.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as authService from "../services/authService";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";

export async function registerHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { name, email, password } = req.body;
    const user = await authService.register(name, email, password);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Rate limit: 10 ครั้ง / 15 นาที ต่อ IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`, { limit: 10, windowSec: 15 * 60 });
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  }

  try {
    const { email, password } = req.body;
    const { user } = await authService.login(email, password);

    // ใช้ HttpOnly cookie แทนการส่ง token ใน JSON body
    // เพื่อป้องกัน XSS token theft
    const token = authService.createToken(user.id);
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

    res.status(200).json({ user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}
