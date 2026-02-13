import type { NextApiRequest, NextApiResponse } from "next";

const SUBDISTRICTS: Record<string, Record<string, string[]>> = {
  Bangkok: {
    "Phra Nakhon": ["Phra Borom Maha Ratchawang", "Wat Sam Phraya"],
    Dusit: ["Dusit", "Wachira Phayaban"],
    "Bang Rak": ["Maha Phruettharam", "Si Phraya"],
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const province =
    typeof req.query.province === "string" ? req.query.province.trim() : "";
  const district =
    typeof req.query.district === "string" ? req.query.district.trim() : "";

  const subdistricts =
    province && district ? SUBDISTRICTS[province]?.[district] ?? [] : [];

  return res.status(200).json({ subdistricts });
}
