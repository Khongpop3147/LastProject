import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      // ตรวจสอบว่า cart item นี้เป็นของ user หรือไม่
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: id as string,
          cart: { userId: user.id },
        },
      });

      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      await prisma.cartItem.delete({ where: { id: id as string } });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: "Cannot delete cart item" });
    }
  }

  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
