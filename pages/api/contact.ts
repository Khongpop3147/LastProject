import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toPlainText(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && Number.isFinite(port) && port > 0 && user && pass) {
    return {
      transport: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }),
      usingFallback: false,
    };
  }

  return {
    transport: nodemailer.createTransport({ jsonTransport: true }),
    usingFallback: true,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = req.body as ContactPayload;
  const name = toPlainText(String(body?.name ?? ""));
  const email = toPlainText(String(body?.email ?? "").toLowerCase());
  const subject = toPlainText(String(body?.subject ?? ""));
  const message = String(body?.message ?? "").trim();

  if (name.length < 2) {
    return res.status(400).json({ error: "กรุณากรอกชื่อ-นามสกุล" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
  }
  if (subject.length < 2) {
    return res.status(400).json({ error: "กรุณากรอกหัวข้อ" });
  }
  if (message.length < 8) {
    return res.status(400).json({ error: "กรุณากรอกรายละเอียดอย่างน้อย 8 ตัวอักษร" });
  }

  const { transport, usingFallback } = getTransport();
  const from = process.env.CONTACT_FROM_EMAIL || "noreply@simplyshop.local";
  const to = process.env.CONTACT_TO_EMAIL || "support@simplyshop.co.th";
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br/>");

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: `[Contact] ${subject}`,
      replyTo: email,
      text: `ชื่อผู้ติดต่อ: ${name}\nอีเมล: ${email}\nหัวข้อ: ${subject}\n\nข้อความ:\n${message}`,
      html: `
        <h3>ข้อความติดต่อใหม่</h3>
        <p><strong>ชื่อผู้ติดต่อ:</strong> ${name}</p>
        <p><strong>อีเมล:</strong> ${email}</p>
        <p><strong>หัวข้อ:</strong> ${subject}</p>
        <p><strong>ข้อความ:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessageHtml}</p>
      `,
    });

    return res.status(201).json({
      success: true,
      messageId: info.messageId ?? "",
      queued: usingFallback,
    });
  } catch {
    return res.status(500).json({ error: "ไม่สามารถส่งข้อความได้ในขณะนี้" });
  }
}
