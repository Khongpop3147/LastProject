import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type AddressCreateBody = {
  recipient?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
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
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });
    return res.status(200).json({ items: addresses });
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as AddressCreateBody;

    const recipient = normalizeText(body.recipient);
    const line1 = normalizeText(body.line1);
    const line2 = normalizeText(body.line2);
    const city = normalizeText(body.city);
    const postalCode = normalizeText(body.postalCode);
    const country = normalizeText(body.country) || "ไทย";

    if (!recipient || !line1 || !city || !postalCode) {
      return res.status(400).json({
        error: "recipient, line1, city, postalCode are required",
      });
    }

    const created = await prisma.address.create({
      data: {
        userId: user.id,
        recipient,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country,
      },
    });

    return res.status(201).json(created);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
