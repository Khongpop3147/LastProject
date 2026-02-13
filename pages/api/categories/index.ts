import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  const locale =
    typeof req.query.locale === "string" && ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  if (req.method === "GET") {
    const locales = await prisma.categoryLocale.findMany({
      where: { locale },
      orderBy: { name: "asc" },
      include: { category: true },
    });

    const cats = locales.map((l) => ({
      id: l.category.id,
      name: l.name,
    }));

    return res.status(200).json(cats);
  }

  if (req.method === "POST") {
    const { nameTh, nameEn } = req.body as {
      nameTh: string;
      nameEn?: string;
    };

    if (!nameTh?.trim()) {
      return res.status(400).json({ error: "Thai name is required" });
    }

    try {
      const cat = await prisma.category.create({
        data: {
          translations: {
            create: [
              { locale: "th", name: nameTh },
              { locale: "en", name: nameEn ?? "" },
            ],
          },
        },
        include: { translations: true },
      });

      return res.status(201).json({
        id: cat.id,
        nameTh: cat.translations.find((t) => t.locale === "th")?.name,
        nameEn: cat.translations.find((t) => t.locale === "en")?.name,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}