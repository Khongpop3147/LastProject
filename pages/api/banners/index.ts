// pages/api/banners/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { prisma } from "@/lib/prisma";

// 1) ปิด bodyParser ของ Next.js เพื่อให้ multer อ่าน multipart/form-data ได้
export const config = { api: { bodyParser: false } };

// 2) ตั้งค่า multer ให้บันทึกรูปลง public/uploads/banners
const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads/banners",
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 3) wrapper ให้ multer ทำงานแบบ promise-friendly
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<void> {
  return new Promise((resolve, reject) =>
    fn(req, res, (err: any) => (err ? reject(err) : resolve()))
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // เรียก multer ก่อน ถ้าเป็น POST ที่มี image
  if (req.method === "POST") {
    await runMiddleware(req, res, upload.single("image"));
  }

  // อ่าน position จาก query (ถ้ามี)
  const posQuery = Array.isArray(req.query.position)
    ? req.query.position[0]
    : req.query.position;

  // GET /api/banners → คืน banners พร้อม translations สองภาษา
  if (req.method === "GET") {
    const whereClause = posQuery ? { position: posQuery } : {};
    const raw = await prisma.banner.findMany({
      where: whereClause,
      include: { translations: true },
      orderBy: { order: "asc" },
    });

    const items = raw.map((b) => {
      const th = b.translations.find((t) => t.locale === "th");
      const en = b.translations.find((t) => t.locale === "en");
      return {
        id: b.id,
        imageUrl: b.imageUrl,
        order: b.order,
        position: b.position,
        titleTh: th?.title ?? "",
        titleEn: en?.title ?? "",
        subTh: th?.sub ?? "",
        subEn: en?.sub ?? "",
        descriptionTh: th?.description ?? "",
        descriptionEn: en?.description ?? "",
      };
    });

    return res.status(200).json({ items });
  }

  // POST /api/banners → สร้าง banner พร้อม translations
  if (req.method === "POST") {
    const file = (req as any).file as Express.Multer.File | undefined;
    const {
      titleTh,
      titleEn,
      subTh,
      subEn,
      descriptionTh,
      descriptionEn,
      order,
      position,
    } = req.body as {
      titleTh: string;
      titleEn: string;
      subTh?: string;
      subEn?: string;
      descriptionTh?: string;
      descriptionEn?: string;
      order?: string;
      position?: string;
    };

    if (!file) {
      return res.status(400).json({ error: "ต้องระบุรูปภาพ (field: image)" });
    }
    if (!titleTh || !titleEn) {
      return res.status(400).json({ error: "ต้องระบุ titleTh และ titleEn" });
    }

    const imageUrl = `/uploads/banners/${file.filename}`;
    const orderNum = parseInt(order ?? "0", 10) || 0;
    const positionValue = position?.trim() || "hero";

    try {
      const banner = await prisma.banner.create({
        data: {
          imageUrl,
          order: orderNum,
          position: positionValue,
          translations: {
            create: [
              {
                locale: "th",
                title: titleTh,
                sub: subTh ?? "",
                description: descriptionTh ?? "",
              },
              {
                locale: "en",
                title: titleEn,
                sub: subEn ?? "",
                description: descriptionEn ?? "",
              },
            ],
          },
        },
        include: { translations: true },
      });

      const th = banner.translations.find((t) => t.locale === "th")!;
      const en = banner.translations.find((t) => t.locale === "en")!;

      return res.status(201).json({
        id: banner.id,
        imageUrl: banner.imageUrl,
        order: banner.order,
        position: banner.position,
        titleTh: th.title,
        titleEn: en.title,
        subTh: th.sub,
        subEn: en.sub,
        descriptionTh: th.description,
        descriptionEn: en.description,
      });
    } catch (err: any) {
      console.error("Error creating banner:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Method Not Allowed
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
