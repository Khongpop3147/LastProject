// pages/api/products/featured.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    // อ่าน locale จาก query string (default 'th')
    const locale =
      typeof req.query.locale === "string" ? req.query.locale : "th";

    // ดึง featured products พร้อม translations ตาม locale
    const raw = await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        translations: { where: { locale } },
        category: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // map ให้ได้รูปแบบที่ frontend คาดไว้
    const featured = raw.map((p) => ({
      id: p.id,
      name: p.translations[0]?.name ?? "",
      description: p.translations[0]?.description ?? "",
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      imageUrl: p.imageUrl,
      category: p.category,
    }));

    return res.status(200).json({ featured });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return res.status(500).json({ error: "Cannot fetch featured products" });
  }
}
