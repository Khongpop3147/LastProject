// pages/api/faqs/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Extract FAQ ID and locale from the query
  const { id } = req.query as { id: string };
  const locale =
    typeof req.query.locale === "string" &&
    ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  if (req.method === "PATCH") {
    const { answer } = req.body as { answer?: string };
    if (typeof answer !== "string") {
      return res.status(400).json({ error: "Answer must be a string" });
    }

    try {
      // Attempt to update the existing translation row
      const updated = await prisma.faqLocale.update({
        where: {
          // Prisma unique compound on [subBannerId, locale] style:
          faqId_locale: {
            faqId: id,
            locale,
          },
        },
        data: {
          answer: answer.trim(),
        },
      });
      return res.status(200).json({
        faqId: updated.faqId,
        locale: updated.locale,
        question: updated.question,
        answer: updated.answer,
      });
    } catch (err: any) {
      // If the translation for that locale doesn't exist
      if (err.code === "P2025") {
        return res
          .status(404)
          .json({
            error: `No translation found for faqId=${id} & locale=${locale}`,
          });
      }
      console.error(err);
      return res.status(500).json({ error: "Unable to update FAQ answer" });
    }
  }

  res.setHeader("Allow", ["PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
