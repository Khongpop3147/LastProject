export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  stock?: number;
};

const STORAGE_KEY = "wishlist_items";
const EVENT_NAME = "wishlist:changed";
const GUEST_KEY = "guest";

function canUseStorage() {
  return typeof window !== "undefined";
}

function resolveStorageKey(userId?: string | null) {
  return `${STORAGE_KEY}:${userId || GUEST_KEY}`;
}

function normalize(items: WishlistItem[]) {
  const map = new Map<string, WishlistItem>();
  for (const item of items) {
    if (!item?.id) continue;
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function getWishlistItems(userId?: string | null): WishlistItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(resolveStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WishlistItem[];
    if (!Array.isArray(parsed)) return [];
    return normalize(parsed);
  } catch {
    return [];
  }
}

function setWishlistItems(items: WishlistItem[], userId?: string | null) {
  if (!canUseStorage()) return;
  const next = normalize(items);
  localStorage.setItem(resolveStorageKey(userId), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { count: next.length, userId: userId || GUEST_KEY },
    })
  );
}

export function isInWishlist(productId: string, userId?: string | null) {
  return getWishlistItems(userId).some((item) => item.id === productId);
}

export function addToWishlist(item: WishlistItem, userId?: string | null) {
  const items = getWishlistItems(userId);
  setWishlistItems([...items, item], userId);
}

export function removeFromWishlist(productId: string, userId?: string | null) {
  const items = getWishlistItems(userId);
  setWishlistItems(
    items.filter((item) => item.id !== productId),
    userId
  );
}

export function clearWishlist(userId?: string | null) {
  setWishlistItems([], userId);
}

export function toggleWishlist(item: WishlistItem, userId?: string | null) {
  if (isInWishlist(item.id, userId)) {
    removeFromWishlist(item.id, userId);
    return false;
  }
  addToWishlist(item, userId);
  return true;
}

export function subscribeWishlist(callback: () => void) {
  if (!canUseStorage()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
