// pages/api/admin/sales-by-date.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export type DailySalesResponse = {
  date: string;
  totalSales: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DailySalesResponse | { error: string }>
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { date } = req.query;
  if (typeof date !== "string") {
    return res.status(400).json({ error: "Missing or invalid date" });
  }

  // parse วันที่รูปแบบ YYYY-MM-DD
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  // aggregate ยอดขายในวันนั้น
  const agg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  const totalSales = agg._sum.totalAmount ?? 0;
  res.status(200).json({ date, totalSales });
}
