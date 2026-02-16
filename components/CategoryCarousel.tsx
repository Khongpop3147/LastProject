// components/CategoryCarousel.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";
import type { Category } from "@/types/product";

interface CategoryCarouselProps {
  categories?: Category[];
}

export default function CategoryCarousel({
  categories = [],
}: CategoryCarouselProps) {
  const { t } = useTranslation("common");
  const displayCategories = categories.slice(0, 16);

  return (
    <>
      {/* Mobile: รูปวงกลมแบบง่าย 4 คอลัมน์ */}
      <div className="grid grid-cols-4 gap-3 md:hidden">
        {displayCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/all-products?category=${cat.id}`}
            className="flex flex-col items-center group"
          >
            <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:shadow-lg">
              <Image
                src={cat.imageUrl ?? "/images/placeholder.png"}
                alt={cat.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <p className="overflow-safe line-clamp-2 text-center text-xs font-medium text-gray-700 transition-colors duration-300 group-hover:text-blue-600">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>

      {/* Desktop: การ์ดใหญ่แบบเต็ม */}
      <div className="hidden grid-cols-5 gap-5 md:grid lg:grid-cols-6">
        {displayCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/all-products?category=${cat.id}`}
            className="flex h-full flex-col group"
          >
            <div className="flex h-full flex-col items-center justify-between p-5 rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1">
              <div className="relative mb-3 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 group-hover:border-blue-400 transition-all duration-300 group-hover:scale-110">
                <Image
                  src={cat.imageUrl ?? "/images/placeholder.png"}
                  alt={cat.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="text-center w-full flex flex-col">
                <p className="overflow-safe mb-1 min-h-[3rem] line-clamp-2 text-base font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                  {cat.name}
                </p>
                <p className="text-sm text-gray-600 font-medium transition-colors duration-300 group-hover:text-gray-800">
                  {cat.productCount
                    ? `${cat.productCount} ${t("unit.items") || "รายการ"}`
                    : `0 ${t("unit.items") || "รายการ"}`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
