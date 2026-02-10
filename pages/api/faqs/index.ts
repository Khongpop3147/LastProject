// pages/api/faqs/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Figure out which locale to use (default to 'th')
  const locale =
    typeof req.query.locale === "string" &&
    ["th", "en"].includes(req.query.locale)
      ? req.query.locale
      : "th";

  if (req.method === "GET") {
    const items = await prisma.faqLocale.findMany({
      where: { locale },
      include: { faq: true },
      orderBy: { faq: { createdAt: "desc" } },
    });

    const faqs = items.map((t) => ({
      id: t.faqId, // <-- use faqId here
      question: t.question,
      answer: t.answer,
    }));

    return res.status(200).json({ faqs });
  }

  if (req.method === "POST") {
    // 4) Validate
    const { question } = req.body as { question?: string };
    if (!question?.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    // 5) Create the FAQ and immediately create its first translation
    const faq = await prisma.faq.create({
      data: {
        translations: {
          create: {
            locale,
            question: question.trim(),
            answer: "", // no answer yet
          },
        },
      },
      include: { translations: true },
    });

    // 6) Return the new record
    return res.status(201).json({
      id: faq.id,
      question: faq.translations[0]!.question,
      answer: faq.translations[0]!.answer,
      locale,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
