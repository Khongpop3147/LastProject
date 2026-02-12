import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Auth Check
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // 2. GET Wishlist
  if (req.method === "GET") {
    try {
      const wishlist = await prisma.wishlistItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              translations: true, // simplified, should filter by locale if needed
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform for frontend
      const products = wishlist.map(
        (item: { product: any; createdAt: any }) => ({
          ...item.product,
          // Helper to get correct translation would be needed here,
          // but for now we send raw product or simplified
          wishlistedAt: item.createdAt,
        }),
      );

      return res.status(200).json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // 3. POST (Add to Wishlist)
  if (req.method === "POST") {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Missing productId" });
    }

    try {
      await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
        },
      });
      return res.status(200).json({ message: "Added to wishlist" });
    } catch (error: any) {
      // Unique constraint violation (P2002) means already wishlisted
      if (error.code === "P2002") {
        return res.status(200).json({ message: "Already in wishlist" });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // 4. DELETE (Clear all wishlist items for current user)
  if (req.method === "DELETE") {
    try {
      const result = await prisma.wishlistItem.deleteMany({
        where: { userId },
      });
      return res.status(200).json({ deletedCount: result.count });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
