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
    <div className="grid grid-cols-4 gap-3 md:grid-cols-6 md:gap-4 lg:grid-cols-8">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center"
        >
          <div className="w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
            <div className="mx-auto mb-1.5 h-11 w-11 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
              <img
                src={cat.imageUrl ?? "/images/placeholder.png"}
                alt={cat.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-center">
              <p className="line-clamp-1 text-[12px] font-semibold text-gray-800">{cat.name}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">
                {cat.productCount ? `${cat.productCount} รายการ` : '0 รายการ'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
