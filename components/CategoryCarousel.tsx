// components/CategoryCarousel.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/types/product";

interface CategoryCarouselProps {
  categories?: Category[];
}

export default function CategoryCarousel({
  categories = [],
}: CategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (delta: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative py-3 bg-white">
      {/* ปุ่มเลื่อนซ้าย */}
      <button
        onClick={() => scroll(-200)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:shadow-lg transition z-10"
        aria-label="Scroll categories left"
      >
        <ChevronLeft size={20} className="text-gray-700" />
      </button>

      {/* แถบเลื่อนหมวดหมู่ */}
      <div
        ref={containerRef}
        className="flex space-x-3 overflow-x-auto px-4 sm:px-8 scrollbar-hide"
        style={{ paddingBottom: 8 }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/all-products?category=${cat.id}`}
            className="
              flex-shrink-0
              bg-white
              rounded-lg
              shadow-md              /* เงาหลัก */
              px-4 sm:px-5 py-2 sm:py-3
              hover:shadow-xl         /* เงาชัดขึ้นตอนโฮเวอร์ */
              transition-shadow
              select-none
              cursor-pointer
            "
          >
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* ปุ่มเลื่อนขวา */}
      <button
        onClick={() => scroll(200)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:shadow-lg transition z-10"
        aria-label="Scroll categories right"
      >
        <ChevronRight size={20} className="text-gray-700" />
      </button>
    </div>
  );
}
