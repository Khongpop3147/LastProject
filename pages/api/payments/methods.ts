import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type MethodId = "credit_card" | "bank_transfer" | "cod";

const METHOD_IDS: MethodId[] = ["credit_card", "bank_transfer", "cod"];

const METHOD_LABEL: Record<MethodId, string> = {
  credit_card: "บัตรเครดิต/เดบิต",
  bank_transfer: "โอนผ่านธนาคาร",
  cod: "เก็บเงินปลายทาง",
};

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
}

function isMethodId(value: string): value is MethodId {
  return METHOD_IDS.includes(value as MethodId);
}

function normalizePreferred(
  raw: unknown,
  latestMethod: string | null | undefined
): MethodId {
  if (typeof raw === "string" && isMethodId(raw)) return raw;
  if (typeof latestMethod === "string" && isMethodId(latestMethod)) {
    return latestMethod;
  }
  return "credit_card";
}

function buildCookie(methodId: MethodId) {
  const maxAge = 60 * 60 * 24 * 365;
  return `preferredPaymentMethod=${methodId}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(getAuthHeader(req));
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      select: { paymentMethod: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const latestMethod = orders.find((item) => Boolean(item.paymentMethod))
      ?.paymentMethod;
    const preferredMethod = normalizePreferred(
      req.cookies.preferredPaymentMethod,
      latestMethod
    );

    const methods = METHOD_IDS.map((id) => {
      const usedOrders = orders.filter((item) => item.paymentMethod === id);
      return {
        id,
        label: METHOD_LABEL[id],
        usedCount: usedOrders.length,
        lastUsedAt: usedOrders[0]?.createdAt ?? null,
      };
    });

    return res.status(200).json({
      preferredMethod,
      methods,
    });
  }

  if (req.method === "PATCH") {
    const method = (req.body?.paymentMethod ?? "") as string;
    if (!isMethodId(method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    res.setHeader("Set-Cookie", buildCookie(method));
    return res.status(200).json({
      preferredMethod: method,
    });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
