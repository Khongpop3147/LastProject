// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

function parseLocale(value: unknown): "th" | "en" {
  return value === "en" ? "en" : "th";
}

function resolveLocalizedName(
  translations: Array<{ locale: string; name: string }>,
  orderLocale: "th" | "en",
  requestedLocale: "th" | "en",
) {
  const orderName = translations.find((item) => item.locale === orderLocale)
    ?.name;
  if (orderName) return orderName;

  const requestedName = translations.find(
    (item) => item.locale === requestedLocale,
  )?.name;
  if (requestedName) return requestedName;

  return translations[0]?.name ?? (requestedLocale === "en" ? "Product" : "สินค้า");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. ดึง user จาก token
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. ใช้ user.id ในการ query
  if (req.method === "GET") {
    const requestedLocale = parseLocale(req.query.locale);
    const rawOrders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: {
                  where: {
                    locale: { in: ["th", "en"] },
                  },
                },
              },
            },
          },
        },
        coupon: true,
      },
    });

    const orders = rawOrders.map((order) => {
      const orderLocale = parseLocale(order.locale);

      return {
        ...order,
        locale: orderLocale,
        items: order.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            name: resolveLocalizedName(
              item.product.translations,
              orderLocale,
              requestedLocale,
            ),
          },
        })),
      };
    });

    return res.status(200).json({ orders });
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
