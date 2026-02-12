import type { Product } from "@/types/product";

type ProductTranslationLike = {
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

export function mapToProduct(raw: ProductWithTranslationLike): Product {
  const translation = raw.translations?.[0];
  return {
    id: raw.id,
    name: translation?.name ?? "สินค้า",
    description: translation?.description ?? "",
    price: raw.price,
    imageUrl: raw.imageUrl ?? null,
    stock: raw.stock,
    salePrice: raw.salePrice ?? null,
    categoryId: raw.categoryId ?? undefined,
    isFeatured: raw.isFeatured,
  };
}

