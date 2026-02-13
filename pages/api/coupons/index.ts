// pages/api/coupons/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Locale = "th" | "en";
type CouponErrorKey = "REQUIRED" | "INVALID" | "EXPIRED" | "USAGE_LIMIT";

const MESSAGES: Record<Locale, Record<CouponErrorKey, string>> = {
  th: {
    REQUIRED:   "กรุณาระบุรหัสคูปอง",
    INVALID:    "โค้ดคูปองไม่ถูกต้อง",
    EXPIRED:    "คูปองหมดอายุแล้ว",
    USAGE_LIMIT:"คูปองถูกใช้งานครบจำนวนที่กำหนดแล้ว",
  },
  en: {
    REQUIRED:   "Coupon code is required",
    INVALID:    "Invalid coupon code",
    EXPIRED:    "Coupon has expired",
    USAGE_LIMIT:"Coupon usage limit reached",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // determine locale
  const locale = (typeof req.query.locale === "string" && ["th","en"].includes(req.query.locale)
    ? req.query.locale
    : "th"
  ) as Locale;

  const T = MESSAGES[locale];

  if (req.method === "GET") {
    const coupons = await prisma.coupon.findMany();
    return res.status(200).json({ items: coupons });
  }

  if (req.method === "POST") {
    const { code } = req.body as { code?: string };
    if (!code) {
      return res.status(400).json({ error: T.REQUIRED });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return res.status(400).json({ error: T.INVALID });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: T.EXPIRED });
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: T.USAGE_LIMIT });
    }

    // Preview only. Usage is incremented when an order is actually created.
    return res.status(200).json({
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
