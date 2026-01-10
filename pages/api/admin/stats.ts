// pages/api/admin/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export type StatsResponse = {
  totalSales: number;
  totalOrders: number;
  newCustomers: number;
  topProducts: Array<{ name: string; sold: number }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  // อ่าน locale จาก query (default เป็น 'th')
  const locale =
    typeof req.query.locale === "string" &&
    ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  // 1) ยอดขายรวม
  const salesAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
  });
  const totalSales = salesAgg._sum.totalAmount ?? 0;

  // 2) นับจำนวนออร์เดอร์ทั้งหมด
  const totalOrders = await prisma.order.count();

  // 3) นับลูกค้าใหม่ใน 30 วันล่าสุด
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // 4) หาสินค้าขายดี (top 5 ตามปริมาณ)
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  // ดึงชื่อสินค้าตาม locale
  const topProducts = await Promise.all(
    top.map(async (t) => {
      const prod = await prisma.product.findUnique({
        where: { id: t.productId },
        include: {
          translations: {
            where: { locale },
            take: 1,
            select: { name: true },
          },
        },
      });

      return {
        name: prod?.translations[0]?.name ?? "Unknown",
        sold: t._sum.quantity ?? 0,
      };
    })
  );

  return res.status(200).json({
    totalSales,
    totalOrders,
    newCustomers,
    topProducts,
  });
}
