// pages/api/orders/[id]/upload-slip.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orderId = req.query.id as string;

  // ตรวจสอบว่า order มีอยู่และเป็นของ user คนนี้
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== user.id) {
    return res.status(404).json({ error: "Order not found" });
  }

  // ตรวจสอบว่าเป็น bank_transfer
  if (order.paymentMethod !== "bank_transfer") {
    return res.status(400).json({
      error: "ไม่สามารถอัปโหลดสลิปได้ เนื่องจากวิธีชำระเงินไม่ใช่โอนผ่านธนาคาร",
    });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  return new Promise<void>((resolve) => {
    form.parse(req, async (err, _fields, files) => {
      if (err) {
        res.status(500).json({ error: "Upload failed" });
        resolve();
        return;
      }

      const fileField = files.slip as
        | FormidableFile
        | FormidableFile[]
        | undefined;

      if (!fileField) {
        res.status(400).json({ error: "No file uploaded" });
        resolve();
        return;
      }

      const fileItem = Array.isArray(fileField) ? fileField[0] : fileField;
      const oldPath = fileItem.filepath;
      const ext = path.extname(fileItem.originalFilename || "");
      const filename = `${orderId}-${Date.now()}${ext}`;
      const newPath = path.join(uploadDir, filename);

      try {
        await fs.promises.rename(oldPath, newPath);
        const slipUrl = `/uploads/slips/${filename}`;

        // อัปเดต order ให้มี slipUrl และเปลี่ยนสถานะเป็น PROCESSING
        await prisma.order.update({
          where: { id: orderId },
          data: {
            slipUrl,
            status: "PROCESSING",
            updatedAt: new Date(),
          },
        });

        res.status(200).json({
          success: true,
          slipUrl,
          message: "อัปโหลดสลิปสำเร็จ รอการตรวจสอบจากทางร้าน",
        });
      } catch (error) {
        console.error("Upload slip error:", error);
        res.status(500).json({ error: "Failed to save slip" });
      }

      resolve();
    });
  });
}
