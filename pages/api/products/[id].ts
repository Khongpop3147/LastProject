// pages/api/products/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { IncomingForm, File } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

type Parsed = {
  fields: Record<string, string>;
  files: Record<string, File>;
};

/**
 * parseForm: parse multipart/form-data via formidable,
 * normalize fields to string and files
 */
const parseForm = (req: NextApiRequest): Promise<Parsed> =>
  new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = new IncomingForm({
      multiples: false,
      uploadDir,
      keepExtensions: true,
    });

    form.parse(
      req,
      (err, fields: Record<string, any>, files: Record<string, any>) => {
        if (err) return reject(err);
        // Normalize fields to string
        const flds: Record<string, string> = {};
        for (const key in fields) {
          const val = fields[key];
          let strVal: string;
          if (Array.isArray(val)) {
            strVal = typeof val[0] === "string" ? val[0] : "";
          } else if (typeof val === "string") {
            strVal = val;
          } else {
            strVal = "";
          }
          flds[key] = strVal;
        }
        // Normalize files
        const normalizedFiles: Record<string, File> = {};
        for (const key in files) {
          const file = files[key];
          if (Array.isArray(file)) {
            if (file[0]) normalizedFiles[key] = file[0];
          } else if (file) {
            normalizedFiles[key] = file;
          }
        }
        resolve({ fields: flds, files: normalizedFiles });
      }
    );
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Extract product ID from query
  const rawId = req.query.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!id) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  // DELETE: delete translations, orderItems, cartItems, then product
  if (req.method === "DELETE") {
    try {
      await prisma.$transaction([
        prisma.productLocale.deleteMany({ where: { productId: id } }),
        prisma.orderItem.deleteMany({ where: { productId: id } }),
        prisma.cartItem.deleteMany({ where: { productId: id } }),
        prisma.product.delete({ where: { id } }),
      ]);
      return res.status(204).end();
    } catch (error: any) {
      console.error("Delete product error:", error);
      return res
        .status(500)
        .json({ error: "Cannot delete product due to existing references" });
    }
  }

  // PUT: update product and upsert translations
  if (req.method === "PUT") {
    try {
      const { fields, files } = await parseForm(req);

      // Parse text fields
      const nameTh = fields.nameTh ?? "";
      const nameEn = fields.nameEn ?? "";
      const descTh = fields.descTh ?? "";
      const descEn = fields.descEn ?? "";
      const price = parseFloat(fields.price || "0");
      const stock = parseInt(fields.stock || "0", 10);
      let salePrice: number | null = null;
      if (fields.salePrice?.trim()) {
        const sp = parseFloat(fields.salePrice);
        if (!isNaN(sp)) salePrice = sp;
      }

      // Build update data
      const updateData: any = { price, stock, salePrice };

      // Category connect/disconnect
      if (fields.categoryId?.trim()) {
        updateData.category = { connect: { id: fields.categoryId } };
      } else {
        updateData.category = { disconnect: true };
      }

      // Update image if provided
      if (files.image) {
        const file = Array.isArray(files.image) ? files.image[0] : files.image;
        const tmpPath = (file.filepath || (file as any).path) as string;
        const fileName = path.basename(tmpPath);
        updateData.imageUrl = `/uploads/${fileName}`;
      }

      // Upsert translations for th & en
      updateData.translations = {
        upsert: [
          {
            where: { productId_locale: { productId: id, locale: "th" } },
            update: { name: nameTh, description: descTh },
            create: { locale: "th", name: nameTh, description: descTh },
          },
          {
            where: { productId_locale: { productId: id, locale: "en" } },
            update: { name: nameEn, description: descEn },
            create: { locale: "en", name: nameEn, description: descEn },
          },
        ],
      };

      const updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { translations: true, category: true },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      console.error("Update product error:", error);
      return res.status(500).json({ error: "Error updating product" });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["DELETE", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
