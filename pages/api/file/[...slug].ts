// pages/api/file/[...slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return res.status(400).json({ error: "Invalid path" });
  }

  // Convert slug array to path string
  const slugPath = (slug as string[]).join(path.sep);
  let filePath = path.join(process.cwd(), "public", "uploads", slugPath);

  // Security: ป้องกัน path traversal
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!filePath.startsWith(uploadDir)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // ถ้าไฟล์ไม่พบ ให้ลองหาใน subfolders ยอดนิยม และสุดท้ายค้นหาโดย basename
    if (!fs.existsSync(filePath)) {
      const candidates = [
        path.join(uploadDir, "products", slugPath),
        path.join(uploadDir, "Products", slugPath),
        path.join(uploadDir, "banners", slugPath),
        path.join(uploadDir, "slips", slugPath),
      ];

      let found = false;
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          filePath = c;
          found = true;
          break;
        }
      }

      // fallback: ค้นหาไฟล์โดย basename ทั่วทั้ง uploadDir (recursive)
      if (!found) {
        const base = path.basename(slugPath);
        const stack = [uploadDir];
        while (stack.length && !found) {
          const dir = stack.pop()!;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const p = path.join(dir, e.name);
            if (e.isFile() && e.name === base) {
              filePath = p;
              found = true;
              break;
            }
            if (e.isDirectory()) stack.push(p);
          }
        }
      }
    }

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
