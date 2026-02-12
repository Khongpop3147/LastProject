import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type AddressPatchBody = {
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

  const id = req.query.id;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const found = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });

  if (!found) {
    return res.status(404).json({ error: "Address not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json(found);
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as AddressPatchBody;

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

    const updated = await prisma.address.update({
      where: { id },
      data: {
        recipient,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country,
      },
    });

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.address.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
