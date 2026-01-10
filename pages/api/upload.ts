// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import path from "path";

// ปิด bodyParser ของ Next.js เพื่อใช้ formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "/public/uploads");
// สร้างโฟลเดอร์ถ้ายังไม่มี
fs.mkdirSync(uploadDir, { recursive: true });

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  form.parse(req, (_err, _fields, files) => {
    // files.file อาจเป็น undefined, FormidableFile, หรือ FormidableFile[]
    const fileField = files.file as
      | FormidableFile
      | FormidableFile[]
      | undefined;

    if (!fileField) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ถ้าเป็นอาเรย์ ให้เอาชิ้นแรก
    const fileItem = Array.isArray(fileField) ? fileField[0] : fileField;
    const oldPath = fileItem.filepath; // v2+ ใช้ filepath
    const fileName = path.basename(oldPath);
    const url = `/uploads/${fileName}`;

    return res.status(200).json({ url });
  });
}
