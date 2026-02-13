import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  const rawId = req.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!id) {
    return res.status(400).json({ error: "Invalid product id" });
  }
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  }

  const { isFeatured } = req.body as { isFeatured: boolean };
  if (typeof isFeatured !== "boolean") {
    return res.status(400).json({ error: "isFeatured must be a boolean" });
  }

  const locale = typeof req.query.locale === "string" ? req.query.locale : "th";

  try {
    const raw = await prisma.product.update({
      where: { id },
      data: { isFeatured },
      include: {
        translations: { where: { locale } },
        category: true,
      },
    });

    const updated = {
      id: raw.id,
      name: raw.translations[0]?.name ?? "",
      description: raw.translations[0]?.description ?? "",
      price: raw.price,
      salePrice: raw.salePrice,
      stock: raw.stock,
      imageUrl: raw.imageUrl,
      category: raw.category,
      isFeatured: raw.isFeatured,
    };

    return res.status(200).json(updated);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return res.status(500).json({ error: "Cannot update featured status" });
  }
}