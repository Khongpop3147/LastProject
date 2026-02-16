import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
}

function parseLimit(raw: unknown) {
  if (typeof raw !== "string") return 20;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(100, Math.floor(n));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const user = await getUserFromToken(getAuthHeader(req));
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = parseLimit(req.query.limit);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      totalAmount: true,
      paymentMethod: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const items = orders.map((order) => ({
    id: order.id,
    orderRef: order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase(),
    amount: order.totalAmount,
    paymentMethod: order.paymentMethod ?? "unknown",
    status: order.status,
    createdAt: order.createdAt,
  }));

  return res.status(200).json({ items });
}
