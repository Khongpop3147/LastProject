import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "@/lib/auth";
import {
  buildCardsCookie,
  readCardsFromCookie,
  sortCards,
  toPublicCard,
  toPublicCards,
} from "@/lib/paymentCards";

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
}

function getId(raw: string | string[] | undefined) {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(getAuthHeader(req));
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const cookieKey = `payment_cards_v1_${user.id}`;

  const id = getId(req.query.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const cards = readCardsFromCookie(req.cookies[cookieKey]);
  const existing = cards.find((item) => item.id === id);
  if (!existing) {
    return res.status(404).json({ error: "Card not found" });
  }

  if (req.method === "PATCH") {
    const setDefault = Boolean(req.body?.isDefault);
    if (!setDefault) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const nextCards = sortCards(
      cards.map((item) => ({
        ...item,
        isDefault: item.id === id,
      }))
    );
    res.setHeader("Set-Cookie", buildCardsCookie(nextCards, cookieKey));
    return res.status(200).json({
      item: toPublicCard(nextCards.find((item) => item.id === id) ?? existing),
      items: toPublicCards(nextCards),
    });
  }

  if (req.method === "DELETE") {
    let nextCards = cards.filter((item) => item.id !== id);
    if (nextCards.length > 0 && !nextCards.some((item) => item.isDefault)) {
      nextCards[0] = { ...nextCards[0], isDefault: true };
    }
    nextCards = sortCards(nextCards);

    res.setHeader("Set-Cookie", buildCardsCookie(nextCards, cookieKey));
    return res.status(200).json({ success: true, items: toPublicCards(nextCards) });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
