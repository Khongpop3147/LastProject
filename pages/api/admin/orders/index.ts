// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { IncomingForm, File } from "formidable";
import fs from "fs";
import path from "path";

// ปิด built-in body parser เพื่อใช้ formidable
export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = new IncomingForm({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Cannot parse form data" });
    }

    try {
      // // // ตรวจสอบสิทธิ์
      const authHeader = req.headers.authorization;
      const user = await getUserFromToken(authHeader);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // helper ดึงค่าแรกจาก string | string[]
      const getFirst = (val: any): string | null =>
        Array.isArray(val) ? val[0] ?? null : val ?? null;

      // normalize ฟิลด์ข้อความ
      const recipient = getFirst(fields.recipient);
      const line1 = getFirst(fields.line1);
      const line2 = getFirst(fields.line2);
      const line3 = getFirst(fields.line3);
      const city = getFirst(fields.city);
      const postalCode = getFirst(fields.postalCode);
      const country = getFirst(fields.country);
      const paymentMethod = getFirst(fields.paymentMethod);
      const couponCodeRaw = getFirst(fields.couponCode);

      if (!recipient || !line1 || !city || !country || !paymentMethod) {
        return res
          .status(400)
          .json({ error: "Missing required address or payment fields" });
      }

      // parse items
      let items: {
        productId: string;
        quantity: number;
        priceAtPurchase: number;
      }[];
      const rawItems = fields.items;
      const itemsStr =
        typeof rawItems === "string"
          ? rawItems
          : Array.isArray(rawItems) && typeof rawItems[0] === "string"
          ? rawItems[0]
          : null;
      if (!itemsStr) {
        return res.status(400).json({ error: "Missing order items" });
      }
      items = JSON.parse(itemsStr);

      // ดึง locale จาก query string ถ้ามี (default "th")
      const locale =
        typeof req.query.locale === "string" &&
        ["th", "en"].includes(req.query.locale)
          ? req.query.locale
          : "th";

      // ตรวจสอบ stock และดึงชื่อสินค้าจาก translations
      for (const item of items) {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            stock: true,
            translations: {
              where: { locale },
              take: 1,
              select: { name: true },
            },
          },
        });
        if (!prod) {
          return res
            .status(400)
            .json({ error: `ไม่พบสินค้า id: ${item.productId}` });
        }
        const productName = prod.translations[0]?.name ?? "Unknown";
        if (prod.stock < item.quantity) {
          return res
            .status(400)
            .json({ error: `สต็อกสินค้า ${productName} ไม่เพียงพอ` });
        }
      }

      // คำนวณยอดรวมก่อนหักส่วนลด
      const totalAmount = items.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      // คำนวณส่วนลด
      let couponId: string | null = null;
      let discountValue = 0;
      if (couponCodeRaw) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: couponCodeRaw },
        });
        if (coupon) {
          couponId = coupon.id;
          discountValue = coupon.discountValue ?? 0;
          if (coupon.discountType === "percent") {
            discountValue = (totalAmount * discountValue) / 100;
          }
        }
      }
      const totalAfterDiscount = Math.max(totalAmount - discountValue, 0);

      // จัดการไฟล์สลิป (multipart) หรือ fallback URL text
      let slipUrl: string | null = null;
      const rawFileField = (files.slipFile ?? files.slipUrl) as
        | File
        | File[]
        | undefined;
      const rawFile = Array.isArray(rawFileField)
        ? rawFileField[0]
        : rawFileField;
      if (rawFile && (rawFile as any).filepath) {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "slips"
        );
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const ext = path.extname((rawFile as any).originalFilename || "");
        const filename = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}${ext}`;
        const dest = path.join(uploadDir, filename);
        await fs.promises.rename((rawFile as any).filepath, dest);
        slipUrl = `/uploads/slips/${filename}`;
      }
      if (!slipUrl && typeof fields.slipUrl === "string") {
        slipUrl = fields.slipUrl;
      }

      // สร้าง order และอัปเดต stock ใน transaction
      const [newOrder] = await prisma.$transaction([
        prisma.order.create({
          data: {
            userId: user.id,
            recipient,
            line1,
            line2,
            line3,
            city,
            postalCode,
            country,
            paymentMethod,
            slipUrl,
            totalAmount: totalAfterDiscount,
            couponId: couponId || undefined,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    translations: {
                      where: { locale },
                      take: 1,
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        }),
        ...items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        ),
      ]);

      // เตรียม response ให้แสดงชื่อ translation ด้วย
      const orderWithNames = {
        ...newOrder,
        items: newOrder.items.map((it) => ({
          ...it,
          product: {
            ...it.product,
            name: it.product.translations[0]?.name ?? "Unknown",
          },
        })),
      };

      return res.status(201).json(orderWithNames);
    } catch (error: any) {
      console.error("Create order error:", error);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ" });
    }
  });
}
