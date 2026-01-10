// pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: false } };

const upload = multer({
  /* ...unchanged... */
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise<void>((resolve, reject) =>
    fn(req, res, (err: any) => (err ? reject(err) : resolve()))
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, upload.single("image"));

  if (req.method === "GET") {
    // ดึง translations มาเต็มๆ ไม่กรอง locale
    const raw = await prisma.product.findMany({
      include: {
        category: true,
        translations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // map ให้คืนทั้งสองภาษา
    const items = raw.map((p) => {
      const th = p.translations.find((t) => t.locale === "th");
      const en = p.translations.find((t) => t.locale === "en");

      return {
        id: p.id,
        nameTh: th?.name ?? "",
        nameEn: en?.name ?? "",
        descTh: th?.description ?? "",
        descEn: en?.description ?? "",
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        imageUrl: p.imageUrl,
        category: p.category,
        isFeatured: p.isFeatured,
      };
    });

    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const file = (req as any).file as Express.Multer.File | undefined;
    const {
      nameTh,
      nameEn,
      descTh,
      descEn,
      price,
      salePrice,
      stock,
      categoryId,
    } = req.body;

    if (!file) {
      return res.status(400).json({ error: "ต้องระบุรูปสินค้า" });
    }
    if (!nameTh || !price) {
      return res.status(400).json({ error: "ต้องระบุชื่อสินค้า (TH) และราคา" });
    }

    try {
      const newProduct = await prisma.product.create({
        data: {
          price: parseFloat(price),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          stock: Number(stock) || 0,
          imageUrl: `/uploads/products/${file.filename}`,
          category: categoryId ? { connect: { id: categoryId } } : undefined,
          translations: {
            create: [
              { locale: "th", name: nameTh, description: descTh || "" },
              { locale: "en", name: nameEn || "", description: descEn || "" },
            ],
          },
        },
        include: { translations: true },
      });

      // คืนเหมือน GET: แปลงชื่อ–รายละเอียดกลับเป็นสองภาษา
      const th = newProduct.translations.find((t) => t.locale === "th");
      const en = newProduct.translations.find((t) => t.locale === "en");

      return res.status(201).json({
        id: newProduct.id,
        nameTh: th?.name ?? "",
        nameEn: en?.name ?? "",
        descTh: th?.description ?? "",
        descEn: en?.description ?? "",
        price: newProduct.price,
        salePrice: newProduct.salePrice,
        stock: newProduct.stock,
        imageUrl: newProduct.imageUrl,
        categoryId: newProduct.categoryId,
        isFeatured: newProduct.isFeatured,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
