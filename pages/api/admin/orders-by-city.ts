import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type OrdersByCityItem = { city: string; orderCount: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrdersByCityItem[] | { error: string }>
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // นับออร์เดอร์ตามเมือง
  const grouped = await prisma.order.groupBy({
    by: ["city"],
    _count: { id: true },
  });

  const data = grouped.map((g) => ({
    city: g.city,
    orderCount: g._count.id,
  }));

  res.status(200).json(data);
}
