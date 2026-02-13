// pages/api/admin/coupons.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

// helper แปลง expiresAt จาก string เป็น Date|null
function parseDate(input?: string) {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const id = Array.isArray(query.id) ? query.id[0] : query.id;
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  try {
    switch (method) {
      // ─── LIST or GET ONE ───────────────────────────────────────────────────
      case "GET":
        if (id) {
          // GET /api/admin/coupons?id=...
          const coupon = await prisma.coupon.findUnique({ where: { id } });
          if (!coupon) return res.status(404).json({ error: "Not found" });
          return res.status(200).json(coupon);
        } else {
          // GET /api/admin/coupons
          const list = await prisma.coupon.findMany({
            orderBy: { id: "desc" },
          });
          return res.status(200).json(list);
        }

      // ─── CREATE ────────────────────────────────────────────────────────────
      case "POST":
        {
          const {
            code,
            discountType,
            discountValue,
            usageLimit,
            expiresAt,
          } = body as {
            code?: string;
            discountType?: "percent" | "fixed";
            discountValue?: number;
            usageLimit?: number;
            expiresAt?: string;
          };

          if (!code || !discountType || typeof discountValue !== "number") {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
          }

          const newCoupon = await prisma.coupon.create({
            data: {
              code,
              discountType,
              discountValue,
              usageLimit: usageLimit ?? null,
              expiresAt: parseDate(expiresAt),
            },
          });
          return res.status(201).json(newCoupon);
        }

      // ─── UPDATE ────────────────────────────────────────────────────────────
      case "PUT":
        if (!id) {
          return res.status(400).json({ error: "Coupon ID is required" });
        }
        {
          const {
            code,
            discountType,
            discountValue,
            usageLimit,
            expiresAt,
          } = body as {
            code?: string;
            discountType?: "percent" | "fixed";
            discountValue?: number;
            usageLimit?: number;
            expiresAt?: string;
          };

          const updated = await prisma.coupon.update({
            where: { id },
            data: {
              ...(code != null && { code }),
              ...(discountType != null && { discountType }),
              ...(discountValue != null && { discountValue }),
              usageLimit: usageLimit ?? null,
              expiresAt: parseDate(expiresAt),
            },
          });
          return res.status(200).json(updated);
        }

      // ─── DELETE ────────────────────────────────────────────────────────────
      case "DELETE":
        if (!id) {
          return res.status(400).json({ error: "Coupon ID is required" });
        }
        await prisma.coupon.delete({ where: { id } });
        return res.status(204).end();

      // ─── METHOD NOT ALLOWED ────────────────────────────────────────────────
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res
          .status(405)
          .end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error("API /admin/coupons error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Server error" });
  }
}
