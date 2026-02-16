import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method === "GET") {
    const sb = await prisma.subBanner.findFirst({
      include: { translations: true },
    });
    if (!sb) return res.status(200).json(null);

    const th = sb.translations.find((t) => t.locale === "th");
    const en = sb.translations.find((t) => t.locale === "en");

    return res.status(200).json({
      id: sb.id,
      imageUrl: sb.imageUrl,
      createdAt: sb.createdAt,
      updatedAt: sb.updatedAt,
      buttonLink: sb.buttonLink,
      titleTh: th?.title ?? "",
      descriptionTh: th?.description ?? "",
      buttonTextTh: th?.buttonText ?? "",
      titleEn: en?.title ?? "",
      descriptionEn: en?.description ?? "",
      buttonTextEn: en?.buttonText ?? "",
    });
  }

  if (req.method === "PUT") {
    const {
      titleTh,
      descriptionTh,
      buttonTextTh,
      titleEn,
      descriptionEn,
      buttonTextEn,
      buttonLink,
      imageUrl,
    } = req.body as {
      titleTh: string;
      descriptionTh?: string;
      buttonTextTh: string;
      titleEn: string;
      descriptionEn?: string;
      buttonTextEn: string;
      buttonLink: string;
      imageUrl?: string;
    };

    if (!titleTh || !buttonTextTh || !titleEn || !buttonTextEn || !buttonLink) {
      return res.status(400).json({
        error:
          "titleTh, buttonTextTh, titleEn, buttonTextEn and buttonLink are required",
      });
    }

    const existing = await prisma.subBanner.findFirst();
    let result;

    if (existing) {
      result = await prisma.subBanner.update({
        where: { id: existing.id },
        data: {
          buttonLink,
          ...(imageUrl !== undefined ? { imageUrl } : {}),
          translations: {
            upsert: [
              {
                where: {
                  subBannerId_locale: {
                    subBannerId: existing.id,
                    locale: "th",
                  },
                },
                update: {
                  title: titleTh,
                  description: descriptionTh ?? "",
                  buttonText: buttonTextTh,
                },
                create: {
                  locale: "th",
                  title: titleTh,
                  description: descriptionTh ?? "",
                  buttonText: buttonTextTh,
                },
              },
              {
                where: {
                  subBannerId_locale: {
                    subBannerId: existing.id,
                    locale: "en",
                  },
                },
                update: {
                  title: titleEn,
                  description: descriptionEn ?? "",
                  buttonText: buttonTextEn,
                },
                create: {
                  locale: "en",
                  title: titleEn,
                  description: descriptionEn ?? "",
                  buttonText: buttonTextEn,
                },
              },
            ],
          },
        },
        include: { translations: true },
      });
    } else {
      result = await prisma.subBanner.create({
        data: {
          buttonLink,
          imageUrl: imageUrl ?? "",
          translations: {
            create: [
              {
                locale: "th",
                title: titleTh,
                description: descriptionTh ?? "",
                buttonText: buttonTextTh,
              },
              {
                locale: "en",
                title: titleEn,
                description: descriptionEn ?? "",
                buttonText: buttonTextEn,
              },
            ],
          },
        },
        include: { translations: true },
      });
    }

    const th = result.translations.find((t) => t.locale === "th");
    const en = result.translations.find((t) => t.locale === "en");

    return res.status(200).json({
      id: result.id,
      imageUrl: result.imageUrl,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      buttonLink: result.buttonLink,
      titleTh: th?.title ?? "",
      descriptionTh: th?.description ?? "",
      buttonTextTh: th?.buttonText ?? "",
      titleEn: en?.title ?? "",
      descriptionEn: en?.description ?? "",
      buttonTextEn: en?.buttonText ?? "",
    });
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}