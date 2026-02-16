import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type SalesTrendItem = { date: string; totalSales: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SalesTrendItem[] | { error: string }>
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 30);

  // Raw SQL เพื่อ group by วันที่ และ cast parameter เป็น timestamp
  const raw = await prisma.$queryRaw<SalesTrendItem[]>`
    SELECT
      TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS date,
      SUM("totalAmount") AS "totalSales"
    FROM "Order"
    WHERE "createdAt" BETWEEN ${past.toISOString()}::timestamp AND ${today.toISOString()}::timestamp
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt");
  `;

  res.status(200).json(raw);
}
