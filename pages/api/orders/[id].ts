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
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rawId = req.query.id;
  const orderId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }
  const requestedLocale = parseLocale(req.query.locale);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  if (!order || order.userId !== user.id) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (req.method === "GET") {
    const orderLocale = parseLocale(order.locale);
    return res.status(200).json({
      order: {
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
      },
    });
  }

  if (req.method === "PATCH") {
    try {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED" },
      });
      return res.status(200).json({ order: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Cannot update status" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
