import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { productId } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

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

  if (!productId || Array.isArray(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }

  // 2. Delete
  try {
    // Delete based on composite key (userId + productId) is not directly supported by delete() 
    // unless we use deleteMany or the unique constraint
    // But since we have @@unique([userId, productId]), we can use it!
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return res.status(200).json({ message: "Removed from wishlist" });
  } catch (error: any) {
    // Record to delete does not exist (P2025)
    if (error.code === "P2025") {
      return res.status(200).json({ message: "Item not found in wishlist" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
