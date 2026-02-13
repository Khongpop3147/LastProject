// pages/api/products/[id]/favorite.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import * as productService from "@/services/productService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query as { id: string };

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    try {
      const result = await productService.addFavorite(user.id, id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await productService.removeFavorite(user.id, id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
