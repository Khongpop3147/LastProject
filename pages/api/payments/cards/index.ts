import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "@/lib/auth";
import {
  buildCardsCookie,
  createCardId,
  detectCardBrand,
  readCardsFromCookie,
  sortCards,
  toPublicCard,
  toPublicCards,
  type StoredPaymentCard,
} from "@/lib/paymentCards";
import { encryptCardNumber } from "@/lib/paymentCardVault";

function getAuthHeader(req: NextApiRequest) {
  if (typeof req.headers.authorization === "string") {
    return req.headers.authorization;
  }
  if (typeof req.cookies.token === "string" && req.cookies.token.length > 0) {
    return `Bearer ${req.cookies.token}`;
  }
  return undefined;
}

function normalizeYear(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 2) return digits.slice(-2);
  return digits;
}

function normalizeMonth(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length === 1) return `0${digits}`;
  return digits.slice(-2);
}

function isValidByLuhn(cardNumber: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index] ?? "0");
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isCardExpired(expMonth: string, expYear: string) {
  const month = Number(expMonth);
  const year = Number(expYear);
  if (!Number.isFinite(month) || !Number.isFinite(year)) return true;

  const fullYear = 2000 + year;
  const expiryDate = new Date(fullYear, month, 0, 23, 59, 59, 999);
  return expiryDate.getTime() < Date.now();
}

function validateInput(
  holderName: string,
  cardNumber: string,
  expMonth: string,
  expYear: string,
  cvv: string
) {
  if (holderName.length < 2) return "กรุณากรอกชื่อเจ้าของบัตร";
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return "เลขบัตรไม่ถูกต้อง";
  }
  if (!isValidByLuhn(cardNumber)) return "เลขบัตรไม่ถูกต้อง";
  if (!/^\d{2}$/.test(expMonth)) return "เดือนหมดอายุไม่ถูกต้อง";
  if (!/^\d{2}$/.test(expYear)) return "ปีหมดอายุไม่ถูกต้อง";
  const month = Number(expMonth);
  if (month < 1 || month > 12) return "เดือนหมดอายุไม่ถูกต้อง";
  if (isCardExpired(expMonth, expYear)) return "บัตรหมดอายุแล้ว";
  if (!/^\d{3,4}$/.test(cvv)) return "CVV ไม่ถูกต้อง";
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

  if (req.method === "GET") {
    const cards = readCardsFromCookie(req.cookies[cookieKey]);
    return res.status(200).json({ items: toPublicCards(sortCards(cards)) });
  }

  if (req.method === "POST") {
    const holderName = String(req.body?.holderName ?? "").trim();
    const cardNumber = String(req.body?.cardNumber ?? "").replace(/\D/g, "");
    const expMonth = normalizeMonth(String(req.body?.expMonth ?? ""));
    const expYear = normalizeYear(String(req.body?.expYear ?? ""));
    const cvv = String(req.body?.cvv ?? "").replace(/\D/g, "");
    const makeDefault = Boolean(req.body?.makeDefault);

    const validationError = validateInput(
      holderName,
      cardNumber,
      expMonth,
      expYear,
      cvv
    );
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const cards = readCardsFromCookie(req.cookies[cookieKey]);
    const newCard: StoredPaymentCard = {
      id: createCardId(),
      holderName,
      brand: detectCardBrand(cardNumber),
      last4: cardNumber.slice(-4),
      encryptedCardNumber: encryptCardNumber(cardNumber),
      expMonth,
      expYear,
      isDefault: cards.length === 0 || makeDefault,
      createdAt: new Date().toISOString(),
    };

    let nextCards = [...cards];
    if (newCard.isDefault) {
      nextCards = nextCards.map((item) => ({ ...item, isDefault: false }));
    }
    nextCards.unshift(newCard);
    nextCards = sortCards(nextCards);

    res.setHeader("Set-Cookie", buildCardsCookie(nextCards, cookieKey));
    return res.status(201).json({
      item: toPublicCard(newCard),
      items: toPublicCards(nextCards),
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
