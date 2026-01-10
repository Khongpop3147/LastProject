// pages/api/banners/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { IncomingForm, File } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // ปิด built-in parser เพื่อใช้ formidable
  },
};

type Parsed = {
  fields: Record<string, string>;
  files: Record<string, File>;
};

const parseForm = (req: NextApiRequest): Promise<Parsed> =>
  new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      multiples: false,
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      // normalize fields to string only
      const flds: Record<string, string> = {};
      for (const key in fields) {
        const raw = fields[key];
        let txt = "";
        if (Array.isArray(raw)) {
          txt = typeof raw[0] === "string" ? raw[0] : "";
        } else if (typeof raw === "string") {
          txt = raw;
        }
        flds[key] = txt;
      }

      // normalize files to single File
      const normalizedFiles: Record<string, File> = {};
      for (const key in files) {
        const fileVal = files[key];
        if (Array.isArray(fileVal)) {
          if (fileVal[0]) normalizedFiles[key] = fileVal[0];
        } else if (fileVal) {
          normalizedFiles[key] = fileVal;
        }
      }

      resolve({ fields: flds, files: normalizedFiles });
    });
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const rawId = req.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!id) {
    return res.status(400).json({ error: "Invalid banner id" });
  }

  // PUT: update banner with locale upsert
  if (req.method === "PUT") {
    try {
      const { fields, files } = await parseForm(req);

      const order = parseInt(fields.order || "0", 10) || 0;
      const position = fields.position?.trim();
      let imageUrl: string | undefined;
      if (files.image) {
        const file = Array.isArray(files.image) ? files.image[0] : files.image;
        const tmpPath = (file.filepath || (file as any).path) as string;
        const fileName = path.basename(tmpPath);
        imageUrl = `/uploads/banners/${fileName}`;
      }

      // locale-specific fields
      const titleTh = fields.titleTh || "";
      const titleEn = fields.titleEn || "";
      const subTh = fields.subTh || "";
      const subEn = fields.subEn || "";
      const descTh = fields.descTh || "";
      const descEn = fields.descEn || "";

      const updated = await prisma.banner.update({
        where: { id },
        data: {
          ...(position ? { position } : {}),
          order,
          ...(imageUrl ? { imageUrl } : {}),
          translations: {
            upsert: [
              {
                where: { bannerId_locale: { bannerId: id, locale: "th" } },
                update: { title: titleTh, sub: subTh, description: descTh },
                create: {
                  locale: "th",
                  title: titleTh,
                  sub: subTh,
                  description: descTh,
                },
              },
              {
                where: { bannerId_locale: { bannerId: id, locale: "en" } },
                update: { title: titleEn, sub: subEn, description: descEn },
                create: {
                  locale: "en",
                  title: titleEn,
                  sub: subEn,
                  description: descEn,
                },
              },
            ],
          },
        },
        include: { translations: true },
      });

      const th = updated.translations.find((t) => t.locale === "th")!;
      const en = updated.translations.find((t) => t.locale === "en")!;
      return res.status(200).json({
        id: updated.id,
        imageUrl: updated.imageUrl,
        order: updated.order,
        position: updated.position,
        titleTh: th.title,
        titleEn: en.title,
        subTh: th.sub,
        subEn: en.sub,
        descriptionTh: th.description,
        descriptionEn: en.description,
      });
    } catch (err: any) {
      console.error("Update banner error:", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการแก้ไขแบนเนอร์" });
    }
  }

  // DELETE: remove banner
  if (req.method === "DELETE") {
    try {
      await prisma.banner.delete({ where: { id } });
      return res.status(204).end();
    } catch (err: any) {
      console.error("Delete banner error:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบแบนเนอร์" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
