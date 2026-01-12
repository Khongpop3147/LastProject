import type { NextApiRequest, NextApiResponse } from "next";
import distanceService from "@/services/distanceService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { originProvince, destinationProvince } = req.body;
  try {
    const originCoords = await distanceService.ensureCoords(null, originProvince);
    const destinationCoords = await distanceService.ensureCoords(null, destinationProvince);
    if (!originCoords || !destinationCoords) return res.status(400).json({ error: "Could not resolve provinces to coordinates" });
    const d = distanceService.computeDistanceAndFee(originCoords, destinationCoords);
    return res.status(200).json({ distanceKm: d.distanceKm, deliveryFee: d.fee });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
}
