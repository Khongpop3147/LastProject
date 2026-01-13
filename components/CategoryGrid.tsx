// components/CategoryGrid.tsx
"use client";

import Link from "next/link";
import type { Category } from "@/types/product";

interface CategoryGridProps {
  categories?: Category[];
}

export default function CategoryGrid({ categories = [] }: CategoryGridProps) {
  // แสดงแค่ 8 หมวดหมู่แรก (2 แถว x 4 คอลัมน์)
  const displayCategories = categories.slice(0, 8);

  return (
    <div className="grid grid-cols-4 gap-3">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/all-products?category=${cat.id}`}
          className="flex flex-col items-center"
        >
          <div className="w-full aspect-square bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow p-2">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-800 mb-1">เลือก่า</p>
              <p className="text-[10px] text-gray-500">156 รายการ</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
