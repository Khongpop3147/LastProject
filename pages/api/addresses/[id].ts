import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return res.status(404).json({ error: "Address not found" });

  if (req.method === "PATCH") {
    const { recipient, line1, line2, city, postalCode, country } = req.body || {};
    const updated = await prisma.address.update({
      where: { id },
      data: {
        recipient: recipient != null ? String(recipient).trim() : existing.recipient,
        line1: line1 != null ? String(line1).trim() : existing.line1,
        line2: line2 != null ? String(line2).trim() : existing.line2,
        city: city != null ? String(city).trim() : existing.city,
        postalCode: postalCode != null ? String(postalCode).trim() : existing.postalCode,
        country: country != null ? String(country).trim() : existing.country,
      },
    });
    return res.status(200).json({ item: updated });
  }

  if (req.method === "DELETE") {
    await prisma.address.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

