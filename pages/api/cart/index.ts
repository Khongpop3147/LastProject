import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ตรวจ token และดึง user
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET /api/cart → ดึงรายการในตะกร้า
  if (req.method === "GET") {
    const locale =
      typeof req.query.locale === "string" && ["th", "en"].includes(req.query.locale)
        ? req.query.locale
        : "th";

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });
    const rawItems = cart?.items || [];

    const candidateNames = Array.from(
      new Set(
        rawItems.flatMap((item) =>
          item.product.translations
            .map((translation) => translation.name?.trim())
            .filter((name): name is string => Boolean(name))
        )
      )
    );

    const supplierNameByProductName = new Map<string, string>();
    if (candidateNames.length > 0) {
      const suppliers = await prisma.supplier.findMany({
        where: {
          productName: {
            in: candidateNames,
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      for (const supplier of suppliers) {
        if (!supplierNameByProductName.has(supplier.productName)) {
          supplierNameByProductName.set(
            supplier.productName,
            supplier.companyName
          );
        }
      }
    }

    const items = rawItems.map((item) => {
      const localizedName =
        item.product.translations.find((t) => t.locale === locale)?.name ||
        item.product.translations[0]?.name ||
        "สินค้า";

      const sellerName =
        item.product.translations
          .map((t) => supplierNameByProductName.get(t.name))
          .find((name): name is string => Boolean(name)) || "ร้านทั่วไป";

      return {
        ...item,
        sellerName,
        product: {
          ...item.product,
          name: localizedName,
        },
      };
    });

    return res.status(200).json({ items });
  }

  // POST /api/cart → เพิ่มหรืออัปเดตจำนวน (เพิ่มจำนวนเข้าไป)
  if (req.method === "POST") {
    const { productId, quantity } = req.body as {
      productId: string;
      quantity: number;
    };

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    let item;
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return res.status(200).json(item);
  }

  // PATCH /api/cart → อัปเดตจำนวนสินค้าแบบ set จำนวนใหม่
  if (req.method === "PATCH") {
    const { itemId, quantity } = req.body as {
      itemId: string;
      quantity: number;
    };

    if (!itemId || quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: "Invalid itemId or quantity" });
    }

    try {
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
      return res.status(200).json(updatedItem);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // DELETE /api/cart → ลบสินค้าออกจากตะกร้า
  if (req.method === "DELETE") {
    const { itemId } = req.body as { itemId?: string };
    if (!itemId) {
      return res.status(400).json({ error: "Missing itemId" });
    }
    try {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
