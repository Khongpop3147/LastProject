// pages/api/file/[...slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || Array.isArray(slug) === false) {
    return res.status(400).json({ error: "Invalid path" });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...slug);

  // Security: ป้องกัน path traversal
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!filePath.startsWith(uploadDir)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();

    // Set appropriate content-type
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
