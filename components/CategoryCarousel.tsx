// components/CategoryCarousel.tsx
"use client";

import Link from "next/link";
import type { Category } from "@/types/product";

interface CategoryCarouselProps {
  categories?: Category[];
}

export default function CategoryCarousel({ categories = [] }: CategoryCarouselProps) {
  // แสดงแค่ 16 หมวดหมู่แรก (เพิ่มขึ้นสำหรับ Desktop)
  const displayCategories = categories.slice(0, 16);

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center"
        >
          <div className="w-full aspect-square bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow p-2">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-800 mb-1">{cat.name}</p>
              <p className="text-[10px] text-gray-500">
                {cat.productCount ? `${cat.productCount} รายการ` : '0 รายการ'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
