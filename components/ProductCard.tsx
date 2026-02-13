"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";

interface ProductCardProps {
  product: Product & { stock: number };
  backgroundColor?: string;
  showBadge?: "sale" | "new" | null;
  salePercent?: number;
}

export default function ProductCard({
  product,
  backgroundColor = "bg-gradient-to-br from-orange-300 to-orange-500",
  showBadge = null,
  salePercent = 25,
}: ProductCardProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      router.push("/login");
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      const res = await fetch(`/api/products/${product.id}/favorite`, {
        method: nextState ? "POST" : "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Favorite request failed with status ${res.status}`);
      }
    } catch (error) {
      console.error("Failed to update favorites", error);
      setIsWishlisted(!nextState);
    }
  };

  const hasDiscount =
    typeof product.salePrice === "number" && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : salePercent;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
        <div
          className={`relative ${backgroundColor} aspect-square overflow-hidden`}
        >
          {showBadge === "sale" && (
            <div className="absolute top-2 right-2 bg-red-500/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
              -{discountPercent}%
            </div>
          )}
          {showBadge === "new" && (
            <div className="absolute top-2 right-2 bg-teal-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
              NEW
            </div>
          )}

          <Image
            src={product.imageUrl ?? "/images/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg text-red-600 font-bold z-20">
              สินค้าหมด
            </div>
          )}

          <button
            onClick={handleWishlist}
            className="absolute bottom-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        <div className="p-3">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[46px]">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xl md:text-2xl font-bold ${
                hasDiscount ? "text-red-600" : "text-teal-700"
              }`}
            >
              ฿
              {displayPrice?.toLocaleString() ?? product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ฿{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
