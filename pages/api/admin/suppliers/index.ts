import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method === "GET") {
    try {
      const list = await prisma.supplier.findMany({
        orderBy: { companyName: "asc" },
      });
      return res.status(200).json(list);
    } catch (err) {
      console.error("Fetch suppliers error:", err);
      return res.status(500).json({ error: "Cannot fetch suppliers" });
    }
  }

  if (req.method === "POST") {
    const { companyName, productName, stock, unitPrice } = req.body;
    try {
      const newItem = await prisma.supplier.create({
        data: {
          companyName,
          productName,
          stock: Number(stock),
          unitPrice: Number(unitPrice),
        },
      });
      return res.status(201).json(newItem);
    } catch (err) {
      console.error("Create supplier error:", err);
      return res.status(500).json({ error: "Cannot create supplier" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
