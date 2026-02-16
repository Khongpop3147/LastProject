import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type StockBySupplierItem = { companyName: string; stock: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StockBySupplierItem[] | { error: string }>
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // รวมสต็อกตามผู้จัดจำหน่าย
  const grouped = await prisma.supplier.groupBy({
    by: ["companyName"],
    _sum: { stock: true },
  });

  const data = grouped.map((g) => ({
    companyName: g.companyName,
    stock: g._sum.stock ?? 0,
  }));

  res.status(200).json(data);
}
