export type AddressType = "home" | "work" | "other";

export type AddressMeta = {
  type: AddressType;
  label: string;
};

export const ADDRESS_TYPE_LABEL: Record<AddressType, string> = {
  home: "บ้าน",
  work: "ที่ทำงาน",
  other: "อื่นๆ",
};

const META_KEY = "address_meta_v1";
const DEFAULT_KEY = "address_default_v1";
const CHECKOUT_SELECTED_KEY = "checkout_selected_address_v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAddressTypeDefaultLabel(type: AddressType) {
  return ADDRESS_TYPE_LABEL[type] ?? ADDRESS_TYPE_LABEL.home;
}

function readMetaMap() {
  if (!canUseStorage()) return {} as Record<string, AddressMeta>;

  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return {} as Record<string, AddressMeta>;
    const parsed = JSON.parse(raw) as Record<string, AddressMeta>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeMetaMap(value: Record<string, AddressMeta>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(value));
}

export function getAddressMeta(addressId: string): AddressMeta {
  const map = readMetaMap();
  return map[addressId] ?? { type: "home", label: getAddressTypeDefaultLabel("home") };
}

export function setAddressMeta(addressId: string, meta: AddressMeta) {
  const map = readMetaMap();
  map[addressId] = meta;
  writeMetaMap(map);
}

export function removeAddressMeta(addressId: string) {
  const map = readMetaMap();
  delete map[addressId];
  writeMetaMap(map);
}

export function getDefaultAddressId() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(DEFAULT_KEY) ?? "";
}

export function setDefaultAddressId(addressId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEFAULT_KEY, addressId);
}

export function clearDefaultAddressId(addressId?: string) {
  if (!canUseStorage()) return;
  if (!addressId) {
    window.localStorage.removeItem(DEFAULT_KEY);
    return;
  }

  const current = getDefaultAddressId();
  if (current === addressId) {
    window.localStorage.removeItem(DEFAULT_KEY);
  }
}

export function getCheckoutSelectedAddressId() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(CHECKOUT_SELECTED_KEY) ?? "";
}

export function setCheckoutSelectedAddressId(addressId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CHECKOUT_SELECTED_KEY, addressId);
}

export function clearCheckoutSelectedAddressId(addressId?: string) {
  if (!canUseStorage()) return;
  if (!addressId) {
    window.localStorage.removeItem(CHECKOUT_SELECTED_KEY);
    return;
  }

  const current = getCheckoutSelectedAddressId();
  if (current === addressId) {
    window.localStorage.removeItem(CHECKOUT_SELECTED_KEY);
  }
}
