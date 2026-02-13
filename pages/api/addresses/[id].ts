import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import {
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  setFavoriteAddress,
} from "@/models/addressModel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const addr = await getAddressById(user.id, id);
    if (!addr) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ address: addr });
  }

  if (req.method === "PUT") {
    const body = req.body || {};

    // support actions via query: ?action=setDefault or ?action=setFavorite
    const action = req.query.action as string | undefined;
    try {
      if (action === "setDefault") {
        const updated = await setDefaultAddress(user.id, id);
        if (!updated)
          return res.status(404).json({ error: "Not found or forbidden" });
        return res.status(200).json({ address: updated });
      }

      if (action === "setFavorite") {
        const val = body.value === true;
        const updated = await setFavoriteAddress(user.id, id, val);
        if (!updated)
          return res.status(404).json({ error: "Not found or forbidden" });
        return res.status(200).json({ address: updated });
      }

      const updated = await updateAddress(user.id, id, body);
      if (!updated)
        return res.status(404).json({ error: "Not found or forbidden" });
      return res.status(200).json({ address: updated });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err?.message || "Bad Request" });
    }
  }

  if (req.method === "DELETE") {
    const ok = await deleteAddress(user.id, id);
    if (!ok) return res.status(404).json({ error: "Not found or forbidden" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
