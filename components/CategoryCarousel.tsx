// components/CategoryCarousel.tsx
"use client";

import Link from "next/link";
import type { Category } from "@/types/product";

interface CategoryCarouselProps {
  categories?: Category[];
}

export default function CategoryCarousel({ categories = [] }: CategoryCarouselProps) {
  // แสดงหมวดหมู่ตามขนาดหน้าจอ: 9 (mobile), 12 (tablet), 18 (desktop)
  const displayCategories = categories.slice(0, 18);

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center"
        >
          <div className="w-full aspect-square bg-white rounded-xl shadow-md border-2 border-gray-200 flex flex-col items-center justify-center hover:shadow-lg hover:border-blue-300 transition-all p-3">
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800 mb-1">{cat.name}</p>
              <p className="text-sm text-blue-600">
                {cat.productCount ? `${cat.productCount} รายการ` : '0 รายการ'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
