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
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center group"
        >
          <div className="w-full aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all p-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 ring-1 ring-teal-100">
              <span className="text-sm font-bold">
                {cat.name?.slice(0, 1) || "#"}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{cat.name}</p>
              <p className="text-xs text-gray-500">
                {cat.productCount
                  ? `${cat.productCount} ${t("unit.items") || "items"}`
                  : `0 ${t("unit.items") || "items"}`}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
