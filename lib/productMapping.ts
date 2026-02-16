import type { Product } from "@/types/product";

type ProductTranslationLike = {
  locale?: string | null;
  name?: string | null;
  description?: string | null;
};

type ProductWithTranslationLike = {
  id: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  salePrice?: number | null;
  categoryId?: string | null;
  isFeatured: boolean;
  translations?: ProductTranslationLike[];
};

type SupportedLocale = "th" | "en";

function normalizeLocale(locale?: string): SupportedLocale {
  return locale === "en" ? "en" : "th";
}

export function mapToProduct(
  raw: ProductWithTranslationLike,
  locale?: string,
): Product {
  const normalizedLocale = normalizeLocale(locale);
  const translation =
    raw.translations?.find((item) => item.locale === normalizedLocale) ??
    raw.translations?.[0];
  const fallbackName = normalizedLocale === "en" ? "Product" : "สินค้า";

  return {
    id: raw.id,
    name: translation?.name ?? fallbackName,
    description: translation?.description ?? "",
    price: raw.price,
    imageUrl: raw.imageUrl ?? null,
    stock: raw.stock,
    salePrice: raw.salePrice ?? null,
    categoryId: raw.categoryId ?? undefined,
    isFeatured: raw.isFeatured,
  };
}

