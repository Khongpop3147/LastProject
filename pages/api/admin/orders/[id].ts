import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Normalize id from query
  const rawId = req.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;
  if (!id) {
    return res.status(400).json({ error: "Missing or invalid order ID" });
  }

  // 2a) PATCH → update status (no auth required)
  if (req.method === "PATCH") {
    const { status } = req.body as { status?: string };
    const allowed = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    try {
      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });
      return res.status(200).json(updated);
    } catch (err) {
      console.error("Update order status error:", err);
      return res.status(500).json({ error: "Cannot update order status" });
    }
  }

  // 2b) DELETE → auth check then delete order + its items
  if (req.method === "DELETE") {
    const authHeader = req.headers.authorization;
    const user = await getUserFromToken(authHeader);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: id } }),
        prisma.order.delete({ where: { id } }),
      ]);
      return res.status(204).end();
    } catch (err) {
      console.error("Delete order error:", err);
      return res.status(500).json({ error: "Cannot delete order" });
    }
  }

  // 3) Method not allowed
  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
