// components/CategoryGrid.tsx
"use client";

import Link from "next/link";
import type { Category } from "@/types/product";

interface CategoryGridProps {
  categories?: Category[];
}

export default function CategoryGrid({ categories = [] }: CategoryGridProps) {
  // แสดงแค่ 9 หมวดหมู่แรก (3 แถว x 3 คอลัมน์)
  const displayCategories = categories.slice(0, 9);

  return (
    <div className="grid grid-cols-6 gap-2">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center"
        >
          <div className="w-full aspect-square bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow p-3">
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800 mb-1">{cat.name}</p>
              <p className="text-sm text-blue-600">{cat.productCount || 0} รายการ</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
