import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { createAddress, listAddressesByUser } from "@/models/addressModel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const list = await listAddressesByUser(user.id);
    return res.status(200).json({ addresses: list, items: list });
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const recipient = String(body.recipient ?? "").trim();
      const line1 = String(body.line1 ?? "").trim();
      const city = String(body.city ?? "").trim();
      const postalCode = String(body.postalCode ?? "").trim();
      const country = String(body.country ?? "").trim();

      if (!recipient || !line1 || !city || !postalCode || !country) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const created = await createAddress(user.id, body);
      return res.status(201).json({ address: created, item: created });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err?.message || "Bad Request" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
