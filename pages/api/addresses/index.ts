import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const items = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });
    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const { recipient, line1, line2, city, postalCode, country } = req.body || {};
    if (!recipient || !line1 || !city || !postalCode || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const created = await prisma.address.create({
      data: {
        userId: user.id,
        recipient: String(recipient).trim(),
        line1: String(line1).trim(),
        line2: line2 ? String(line2).trim() : null,
        city: String(city).trim(),
        postalCode: String(postalCode).trim(),
        country: String(country).trim(),
      },
    });
    return res.status(201).json({ item: created });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

