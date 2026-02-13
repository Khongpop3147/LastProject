import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/requireAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { errorSent } = await requireAdmin(req, res);
  if (errorSent) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, (_err, _fields, files) => {
    const fileField = files.file as FormidableFile | FormidableFile[] | undefined;

    if (!fileField) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileItem = Array.isArray(fileField) ? fileField[0] : fileField;
    const oldPath = fileItem.filepath;
    const fileName = path.basename(oldPath);
    const url = `/uploads/${fileName}`;

    return res.status(200).json({ url });
  });
}