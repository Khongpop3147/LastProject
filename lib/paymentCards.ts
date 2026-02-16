export const PAYMENT_CARDS_COOKIE_KEY = "payment_cards_v1";

export type StoredPaymentCard = {
  id: string;
  holderName: string;
  brand: string;
  last4: string;
  encryptedCardNumber?: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
  createdAt: string;
};

export type PublicPaymentCard = Omit<StoredPaymentCard, "encryptedCardNumber">;

function toTwoDigits(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 1) return `0${trimmed}`;
  return trimmed.slice(-2);
}

function sanitizeCards(input: unknown): StoredPaymentCard[] {
  if (!Array.isArray(input)) return [];

  const items: StoredPaymentCard[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<StoredPaymentCard>;

    if (
      typeof item.id !== "string" ||
      typeof item.holderName !== "string" ||
      typeof item.brand !== "string" ||
      typeof item.last4 !== "string" ||
      typeof item.expMonth !== "string" ||
      typeof item.expYear !== "string" ||
      typeof item.createdAt !== "string"
    ) {
      continue;
    }

    items.push({
      id: item.id,
      holderName: item.holderName.trim(),
      brand: item.brand.trim(),
      last4: item.last4.replace(/\D/g, "").slice(-4),
      encryptedCardNumber:
        typeof item.encryptedCardNumber === "string" &&
        item.encryptedCardNumber.length > 0
          ? item.encryptedCardNumber
          : undefined,
      expMonth: toTwoDigits(item.expMonth),
      expYear: toTwoDigits(item.expYear),
      isDefault: Boolean(item.isDefault),
      createdAt: item.createdAt,
    });
  }

  const hasDefault = items.some((item) => item.isDefault);
  if (!hasDefault && items[0]) {
    items[0].isDefault = true;
  }

  return items;
}

export function readCardsFromCookie(rawCookieValue?: string) {
  if (!rawCookieValue) return [] as StoredPaymentCard[];
  try {
    const decoded = decodeURIComponent(rawCookieValue);
    const parsed = JSON.parse(decoded);
    return sanitizeCards(parsed);
  } catch {
    return [] as StoredPaymentCard[];
  }
}

export function sortCards(cards: StoredPaymentCard[]) {
  const cloned = [...cards];
  cloned.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return cloned;
}

export function toPublicCard(card: StoredPaymentCard): PublicPaymentCard {
  return {
    id: card.id,
    holderName: card.holderName,
    brand: card.brand,
    last4: card.last4,
    expMonth: card.expMonth,
    expYear: card.expYear,
    isDefault: card.isDefault,
    createdAt: card.createdAt,
  };
}

export function toPublicCards(cards: StoredPaymentCard[]) {
  return cards.map(toPublicCard);
}

export function buildCardsCookie(
  cards: StoredPaymentCard[],
  cookieKey = PAYMENT_CARDS_COOKIE_KEY
) {
  const maxAge = 60 * 60 * 24 * 365;
  const value = encodeURIComponent(JSON.stringify(sortCards(cards)));
  return `${cookieKey}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`;
}

export function detectCardBrand(cardNumberDigits: string) {
  if (/^4/.test(cardNumberDigits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(cardNumberDigits)) return "mastercard";
  if (/^3[47]/.test(cardNumberDigits)) return "amex";
  if (/^(35)/.test(cardNumberDigits)) return "jcb";
  if (/^(62)/.test(cardNumberDigits)) return "unionpay";
  return "card";
}

export function createCardId() {
  return `card_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
