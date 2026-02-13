// pages/api/auth/favorites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "@/lib/auth";
import * as productService from "@/services/productService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const favorites = await productService.listFavorites(user.id);
  return res.status(200).json({ favorites });
}
