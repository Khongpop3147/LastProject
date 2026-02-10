// components/DiscountCarousel.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/types/product";

interface Props {
  items: Array<Product & { stock: number }>;
}

export default function DiscountCarousel({ items }: Props) {
  const [idx, setIdx] = useState(0);
  const total = items.length;
  const { token } = useAuth();
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);

  // เลือกจำนวนสินค้าที่จะแสดง ตามขนาดหน้าจอ
  // ตั้งค่าเริ่มต้นเป็น 2 (mobile) แล้วอัปเดตใน useEffect
  const [displayCount, setDisplayCount] = useState<number>(2);
  useEffect(() => {
    // ฟังก์ชันคำนวณจำนวนสินค้าตามความกว้างหน้าจอ
    const updateCount = () => {
      const w = window.innerWidth;
      let count = 2;
      if (w < 640) count = 2;
      else if (w < 768) count = 3;
      else if (w < 1024) count = 4;
      else count = 6;
      setDisplayCount(Math.min(count, total));
    };
    // รันทันทีตอน mount
    updateCount();
    // ฟัง resize
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, [total]);

  if (total === 0) return null;

  const prev = () => setIdx((i) => (i - displayCount + total) % total);
  const next = () => setIdx((i) => (i + displayCount) % total);

  // สร้างชุดสินค้าที่จะแสดงตาม idx และ displayCount
  const visible = Array.from({ length: displayCount }, (_, i) => {
    const index = (idx + i) % total;
    return items[index];
  });

  const handleAdd = async (
    e: React.MouseEvent,
    p: Product & { stock: number }
  ) => {
    e.stopPropagation();
    if (p.stock === 0) return;
    if (!token) {
      router.push("/login");
      return;
    }
    setAddingId(p.id);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: p.id, quantity: 1 }),
      });
      if (res.ok) router.push("/cart");
    } catch {
      alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="container relative rounded-2xl px-4 sm:px-6 lg:px-8 py-8 my-8 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl sm:text-2xl font-bold text-gray-800">
            สินค้าลดราคา
          </span>
        </div>
        <button
          onClick={() => router.push("/all-products?discount=1")}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center gap-1 font-medium"
        >
          ดูทั้งหมด
          <ChevronRight size={18} />
        </button>
      </div>

      <button
        onClick={prev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white p-2 sm:p-3 rounded-full shadow hover:bg-white transition z-20"
      >
        <ChevronLeft size={20} className="text-orange-600" />
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visible.map((p) => (
          <div
            key={p.id}
            onClick={() => p.stock > 0 && router.push(`/products/${p.id}`)}
            className="cursor-pointer bg-white rounded-xl border shadow-sm p-4 flex flex-col items-center text-center hover:shadow-lg transition"
          >
            <div className="relative w-full pt-[100%] mb-3 rounded-lg overflow-hidden">
              <Image
                src={p.imageUrl ?? "/images/placeholder.png"}
                alt={p.name}
                fill
                className="object-cover"
              />
              {p.stock === 0 && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center text-red-600 font-bold">
                  สินค้าหมด
                </div>
              )}
            </div>

            <h3 className="text-gray-800 font-medium mb-1">{p.name}</h3>
            {p.description && (
              <p className="text-gray-500 text-xs mb-2 line-clamp-2">
                {p.description}
              </p>
            )}

            <div className="mb-3 flex items-center justify-center space-x-2">
              {p.salePrice != null && (
                <span className="text-gray-400 line-through text-sm">
                  ฿{p.price}
                </span>
              )}
              <span className="text-red-600 font-bold">
                ฿{p.salePrice ?? p.price}
              </span>
            </div>

            <button
              onClick={(e) => handleAdd(e, p)}
              disabled={addingId === p.id || p.stock === 0}
              className={`mt-auto flex items-center justify-center p-2 rounded-full shadow transition disabled:opacity-50 ${
                p.stock === 0
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {addingId === p.id ? "กำลังเพิ่ม..." : <Plus size={16} />}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={next}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white p-2 sm:p-3 rounded-full shadow hover:bg-white transition z-20"
      >
        <ChevronRight size={20} className="text-orange-600" />
      </button>
    </div>
  );
}
