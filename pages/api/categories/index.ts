// pages/api/categories/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // รับ locale จาก query string (default = 'th')
  const locale = (req.query.locale as string) || "th";

  if (req.method === "GET") {
    // 1) ดึงจาก CategoryLocale แล้ว orderBy name ได้เลย
    const locales = await prisma.categoryLocale.findMany({
      where: { locale },
      orderBy: { name: "asc" },
      include: { category: true },
    });

    // 2) map ให้ได้รูปแบบเดียวกับเดิม { id, name }
    const cats = locales.map((l) => ({
      id: l.category.id,
      name: l.name,
    }));

    return res.status(200).json(cats);
  }

  if (req.method === "POST") {
    // body ควรส่งมาเป็น { nameTh: string, nameEn?: string }
    const { nameTh, nameEn } = req.body as {
      nameTh: string;
      nameEn?: string;
    };

    if (!nameTh?.trim()) {
      return res.status(400).json({ error: "ต้องระบุชื่อภาษาไทย" });
    }

    try {
      // สร้าง Category พร้อม translations ทั้ง 2 ภาษา
      const cat = await prisma.category.create({
        data: {
          translations: {
            create: [
              { locale: "th", name: nameTh },
              { locale: "en", name: nameEn ?? "" },
            ],
          },
        },
        include: { translations: true },
      });

      return res.status(201).json({
        id: cat.id,
        nameTh: cat.translations.find((t) => t.locale === "th")?.name,
        nameEn: cat.translations.find((t) => t.locale === "en")?.name,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
