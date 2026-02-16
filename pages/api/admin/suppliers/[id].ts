import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const supplierId = Array.isArray(id) ? id[0] : id;
  if (!supplierId) {
    return res.status(400).json({ error: "Missing supplier id" });
  }

  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method === "PATCH") {
    const { companyName, productName, stock, unitPrice, lineId } = req.body;
    try {
      const updated = await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          companyName,
          productName,
          stock: Number(stock),
          unitPrice: Number(unitPrice),
          lineId: lineId ?? undefined,
        },
      });
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Update supplier error:", err);
      return res.status(500).json({ error: "Cannot update supplier" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.supplier.delete({ where: { id: supplierId } });
      return res.status(204).end();
    } catch (err) {
      console.error("Delete supplier error:", err);
      return res.status(500).json({ error: "Cannot delete supplier" });
    }
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end();
}