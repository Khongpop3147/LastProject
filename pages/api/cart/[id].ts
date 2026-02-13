import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rawId = req.query.id;
  const itemId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  if (!itemId) {
    return res.status(400).json({ error: "Invalid item id" });
  }

  const ownedItem = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: user.id } },
    include: { product: { select: { stock: true } } },
  });
  if (!ownedItem) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  if (req.method === "PATCH") {
    const { quantity } = req.body as { quantity?: number };
    if (typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    if (quantity > ownedItem.product.stock) {
      return res.status(400).json({ error: "Quantity exceeds product stock" });
    }

    try {
      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
      return res.status(200).json(updated);
    } catch {
      return res.status(400).json({ error: "Cannot update cart item" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.status(200).json({ success: true });
    } catch {
      return res.status(400).json({ error: "Cannot delete cart item" });
    }
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
