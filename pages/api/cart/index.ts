import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

function parseLocale(value: unknown): "th" | "en" {
  return value === "en" ? "en" : "th";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const locale = parseLocale(req.query.locale);

  if (req.method === "GET") {
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
            .filter((name): name is string => Boolean(name)),
        ),
      ),
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
            supplier.companyName,
          );
        }
      }
    }

    const items = rawItems.map((item) => {
      const localized =
        item.product.translations.find((t) => t.locale === locale) ||
        item.product.translations[0];
      const name = localized?.name ?? "สินค้า";
      const description = localized?.description ?? "";
      const sellerName =
        item.product.translations
          .map((t) => supplierNameByProductName.get(t.name))
          .find((value): value is string => Boolean(value)) || "ร้านทั่วไป";

      return {
        id: item.id,
        quantity: item.quantity,
        sellerName,
        product: {
          id: item.product.id,
          name,
          description,
          price: item.product.price,
          salePrice: item.product.salePrice,
          imageUrl: item.product.imageUrl,
          stock: item.product.stock,
          translations: item.product.translations,
        },
      };
    });

    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const { productId, quantity } = req.body as {
      productId?: string;
      quantity?: number;
    };

    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
      select: { id: true, quantity: true },
    });
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) {
      return res.status(400).json({ error: "Quantity exceeds product stock" });
    }

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: nextQuantity },
        })
      : await prisma.cartItem.create({
          data: { cartId: cart.id, productId, quantity },
        });

    return res.status(200).json(item);
  }

  if (req.method === "PATCH") {
    const { itemId, quantity } = req.body as {
      itemId?: string;
      quantity?: number;
    };

    if (!itemId || typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({ error: "Invalid itemId or quantity" });
    }

    try {
      const ownedItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cart: { userId: user.id } },
        include: { product: { select: { stock: true } } },
      });
      if (!ownedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      if (quantity > ownedItem.product.stock) {
        return res
          .status(400)
          .json({ error: "Quantity exceeds product stock" });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
      return res.status(200).json(updatedItem);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { itemId } = req.body as { itemId?: string };
    if (!itemId) {
      return res.status(400).json({ error: "Missing itemId" });
    }

    try {
      const ownedItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cart: { userId: user.id } },
        select: { id: true },
      });
      if (!ownedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
