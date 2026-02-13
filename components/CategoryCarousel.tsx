// components/CategoryCarousel.tsx
"use client";

import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import type { Category } from "@/types/product";

interface CategoryCarouselProps {
  categories?: Category[];
}

export default function CategoryCarousel({ categories = [] }: CategoryCarouselProps) {
  const { t } = useTranslation("common");
  const displayCategories = categories.slice(0, 16);

  return (
    <div className="grid grid-cols-4 gap-3 md:grid-cols-6 md:gap-4 lg:grid-cols-8">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center group"
        >
          <div className="w-full aspect-square rounded-xl md:rounded-2xl border border-gray-100 bg-white p-2 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="mx-auto mb-1.5 h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
              <img
                src={cat.imageUrl ?? "/images/placeholder.png"}
                alt={cat.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-center">
              <p className="line-clamp-1 md:line-clamp-2 text-[11px] md:text-sm font-semibold text-gray-800">{cat.name}</p>
              <p className="mt-0.5 text-[10px] md:text-xs text-gray-500">
                {cat.productCount ? `${cat.productCount} ${t("unit.items") || "รายการ"}` : `0 ${t("unit.items") || "รายการ"}`}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
