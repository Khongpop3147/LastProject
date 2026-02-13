import type { NextApiRequest, NextApiResponse } from "next";

const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Bangkok: ["Phra Nakhon", "Dusit", "Bang Rak"],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const province =
    typeof req.query.province === "string" ? req.query.province.trim() : "";
  const districts = province ? DISTRICTS_BY_PROVINCE[province] ?? [] : [];

  return res.status(200).json({ districts });
}
