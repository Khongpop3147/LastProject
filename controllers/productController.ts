import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../lib/prisma";

type Locale = "th" | "en";

function parseLocale(value: unknown): Locale {
  return value === "en" ? "en" : "th";
}

export async function listProducts(req: NextApiRequest, res: NextApiResponse) {
  const locale = parseLocale(req.query.locale);
  const items = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  return res.status(200).json({
    items: items.map((p) => ({
      id: p.id,
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl,
      name: p.translations[0]?.name ?? "",
      description: p.translations[0]?.description ?? "",
      material: p.translations[0]?.material ?? null,
    })),
  });
}

export async function getProductById(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const locale = parseLocale(req.query.locale);
  const { id } = req.query;
  const item = await prisma.product.findUnique({
    where: { id: id as string },
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  if (!item) return res.status(404).json({ error: "Not found" });

  return res.status(200).json({
    id: item.id,
    price: item.price,
    salePrice: item.salePrice,
    stock: item.stock,
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    name: item.translations[0]?.name ?? "",
    description: item.translations[0]?.description ?? "",
    material: item.translations[0]?.material ?? null,
  });
}

export async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const locale = parseLocale(req.body?.locale);
  const { name, description, material, price, stock, categoryId, imageUrl } =
    req.body ?? {};

  const parsedPrice = Number(price);
  const parsedStock = Number.parseInt(String(stock ?? 0), 10);

  if (!name || Number.isNaN(parsedPrice)) {
    return res.status(400).json({ error: "Missing required product fields" });
  }

  try {
    const product = await prisma.product.create({
      data: {
        price: parsedPrice,
        stock: Number.isNaN(parsedStock) ? 0 : parsedStock,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
        translations: {
          create: {
            locale,
            name,
            description: description || null,
            material: material || null,
          },
        },
      },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
    });

    return res.status(201).json({
      id: product.id,
      price: product.price,
      salePrice: product.salePrice,
      stock: product.stock,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      name: product.translations[0]?.name ?? "",
      description: product.translations[0]?.description ?? "",
      material: product.translations[0]?.material ?? null,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
