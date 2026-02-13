import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const locale =
    typeof req.query.locale === "string" && ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  if (req.method === "GET") {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: {
                  where: { locale },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const items = (cart?.items || []).map((it) => ({
      id: it.id,
      quantity: it.quantity,
      product: {
        id: it.product.id,
        name: it.product.translations[0]?.name ?? "",
        description: it.product.translations[0]?.description ?? "",
        price: it.product.price,
        salePrice: it.product.salePrice,
        imageUrl: it.product.imageUrl,
        stock: it.product.stock,
      },
    }));

    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const { productId, quantity } = req.body as {
      productId: string;
      quantity: number;
    };

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
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

  if (req.method === "PATCH") {
    const { itemId, quantity } = req.body as {
      itemId: string;
      quantity: number;
    };

    if (!itemId || quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: "Invalid itemId or quantity" });
    }

    try {
      const ownedItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cart: { userId: user.id } },
      });

      if (!ownedItem) {
        return res.status(404).json({ error: "Cart item not found" });
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
  res.status(405).end(`Method ${req.method} Not Allowed`);
}