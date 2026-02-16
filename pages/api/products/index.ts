import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const config = { api: { bodyParser: false } };

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "products"
      );
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
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
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method === "POST") {
    await runMiddleware(req, res, upload.single("image"));
  }

  if (req.method === "GET") {
    const raw = await prisma.product.findMany({
      include: {
        category: true,
        translations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const items = raw.map((p) => {
      const th = p.translations.find((t) => t.locale === "th");
      const en = p.translations.find((t) => t.locale === "en");

      return {
        id: p.id,
        nameTh: th?.name ?? "",
        nameEn: en?.name ?? "",
        descTh: th?.description ?? "",
        descEn: en?.description ?? "",
        materialTh: th?.material ?? "",
        materialEn: en?.material ?? "",
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        imageUrl: p.imageUrl,
        category: p.category,
        categoryId: p.categoryId,
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
      materialTh,
      materialEn,
      price,
      salePrice,
      stock,
      categoryId,
    } = req.body;

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }
    if (!nameTh || !price) {
      return res
        .status(400)
        .json({ error: "Thai name and price are required" });
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
              {
                locale: "th",
                name: nameTh,
                description: descTh || "",
                material: materialTh || "",
              },
              {
                locale: "en",
                name: nameEn || "",
                description: descEn || "",
                material: materialEn || "",
              },
            ],
          },
        },
        include: { translations: true },
      });

      const th = newProduct.translations.find((t) => t.locale === "th");
      const en = newProduct.translations.find((t) => t.locale === "en");

      return res.status(201).json({
        id: newProduct.id,
        nameTh: th?.name ?? "",
        nameEn: en?.name ?? "",
        descTh: th?.description ?? "",
        descEn: en?.description ?? "",
        materialTh: th?.material ?? "",
        materialEn: en?.material ?? "",
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