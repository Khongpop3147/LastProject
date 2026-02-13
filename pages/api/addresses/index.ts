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
    return res.status(200).json({ addresses: list });
  }

  if (req.method === "POST") {
    try {
      const body = req.body;
      const created = await createAddress(user.id, body);
      return res.status(201).json({ address: created });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err?.message || "Bad Request" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
