import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type CategorySalesItem = { category: string; totalSales: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CategorySalesItem[] | { error: string }>
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const locale =
    typeof req.query.locale === "string" &&
    ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  const raw = await prisma.$queryRaw<CategorySalesItem[]>`
    SELECT
      COALESCE(cl.name, 'Uncategorized') AS category,
      SUM(oi.quantity * oi."priceAtPurchase")::float AS "totalSales"
    FROM "OrderItem" oi
    JOIN "Product" p ON p.id = oi."productId"
    JOIN "Category" c ON c.id = p."categoryId"
    LEFT JOIN "CategoryLocale" cl
      ON cl."categoryId" = c.id AND cl.locale = ${locale}
    GROUP BY c.id, cl.name
    ORDER BY category;
  `;

  res.status(200).json(raw);
}
