import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  const rawId = req.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!id) {
    return res.status(400).json({ error: "Invalid category id" });
  }

  if (req.method === "DELETE") {
    try {
      await prisma.categoryLocale.deleteMany({ where: { categoryId: id } });
      await prisma.category.delete({ where: { id } });
      return res.status(204).end();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}