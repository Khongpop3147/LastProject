export type AddressLine2Meta = {
  phone: string;
  district: string;
  subdistrict: string;
  note: string;
};

type AddressLike = {
  line1: string;
  line2?: string | null;
  city: string;
  postalCode?: string | null;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stripPrefix(raw: string, prefixes: string[]) {
  const text = raw.trim();
  const lowerText = text.toLowerCase();
  for (const prefix of prefixes) {
    if (lowerText.startsWith(prefix.toLowerCase())) {
      return text.slice(prefix.length).trim();
    }
  }
  return text;
}

export function buildAddressLine2(meta: Partial<AddressLine2Meta>) {
  const chunks: string[] = [];
  const phone = normalizeText(meta.phone);
  const district = normalizeText(meta.district);
  const subdistrict = normalizeText(meta.subdistrict);
  const note = normalizeText(meta.note);

  if (phone) chunks.push(`โทร: ${phone}`);
  if (district) chunks.push(`เขต/อำเภอ: ${district}`);
  if (subdistrict) chunks.push(`แขวง/ตำบล: ${subdistrict}`);
  if (note) chunks.push(note);

  return chunks.join(" | ");
}

export function parseAddressLine2(line2?: string | null): AddressLine2Meta {
  const raw = normalizeText(line2);
  const initial: AddressLine2Meta = {
    phone: "",
    district: "",
    subdistrict: "",
    note: "",
  };

  if (!raw) return initial;

  const parts = raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  const remainNotes: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (
      lower.startsWith("โทร") ||
      lower.startsWith("เบอร์") ||
      lower.startsWith("phone")
    ) {
      initial.phone = stripPrefix(part, ["โทรศัพท์:", "โทรศัพท์", "โทร:", "โทร", "เบอร์:", "เบอร์", "phone:", "phone"]);
      continue;
    }

    if (
      lower.startsWith("เขต/อำเภอ") ||
      lower.startsWith("เขต") ||
      lower.startsWith("อำเภอ") ||
      lower.startsWith("district")
    ) {
      initial.district = stripPrefix(part, ["เขต/อำเภอ:", "เขต/อำเภอ", "เขต:", "เขต", "อำเภอ:", "อำเภอ", "district:"]);
      continue;
    }

    if (
      lower.startsWith("แขวง/ตำบล") ||
      lower.startsWith("แขวง") ||
      lower.startsWith("ตำบล") ||
      lower.startsWith("subdistrict")
    ) {
      initial.subdistrict = stripPrefix(part, ["แขวง/ตำบล:", "แขวง/ตำบล", "แขวง:", "แขวง", "ตำบล:", "ตำบล", "subdistrict:"]);
      continue;
    }

    remainNotes.push(part);
  }

  initial.note = remainNotes.join(" | ");
  return initial;
}

export function composeAddressSummary(address: AddressLike) {
  const line1 = normalizeText(address.line1);
  const city = normalizeText(address.city);
  const postalCode = normalizeText(address.postalCode);
  const line2Meta = parseAddressLine2(address.line2);

  const chunks = [
    line1,
    line2Meta.subdistrict,
    line2Meta.district,
    city,
    postalCode,
  ].filter(Boolean);

  return chunks.join(" ");
}
