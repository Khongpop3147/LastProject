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

  const rawId = req.query.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (req.method === "GET") {
    const addr = await getAddressById(user.id, id);
    if (!addr) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ address: addr, item: addr });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const body = req.body || {};

    // support actions via query: ?action=setDefault or ?action=setFavorite
    const rawAction = req.query.action;
    const action =
      typeof rawAction === "string"
        ? rawAction
        : Array.isArray(rawAction)
          ? rawAction[0]
          : undefined;
    try {
      if (action === "setDefault") {
        const updated = await setDefaultAddress(user.id, id);
        if (!updated)
          return res.status(404).json({ error: "Not found or forbidden" });
        return res.status(200).json({ address: updated, item: updated });
      }

      if (action === "setFavorite") {
        const val = body.value === true;
        const updated = await setFavoriteAddress(user.id, id, val);
        if (!updated)
          return res.status(404).json({ error: "Not found or forbidden" });
        return res.status(200).json({ address: updated, item: updated });
      }

      const updated = await updateAddress(user.id, id, body);
      if (!updated)
        return res.status(404).json({ error: "Not found or forbidden" });
      return res.status(200).json({ address: updated, item: updated });
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

  res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
