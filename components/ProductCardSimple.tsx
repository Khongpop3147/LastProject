// components/ProductCardSimple.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductCardSimpleProps {
  product: Product & { stock: number };
  showBadge?: "new" | "sale" | null;
  salePercent?: number;
}

export default function ProductCardSimple({
  product,
  showBadge = null,
  salePercent,
}: ProductCardSimpleProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
        {/* Product Image */}
        <div className="relative w-full aspect-square">
          <Image
            src={product.imageUrl ?? "/images/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover"
          />

          {/* Badge - Top Left */}
          {showBadge === "new" && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              ใหม่
            </div>
          )}
          {showBadge === "sale" && salePercent && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              ลด {salePercent}%
            </div>
          )}

          {/* Favorite Heart - Bottom Right */}
          <button
            onClick={handleFavoriteClick}
            className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            {product.salePrice != null ? (
              <>
                <span className="text-blue-600 font-bold text-base">
                  ฿{product.salePrice}
                </span>
                <span className="text-gray-400 line-through text-xs">
                  ฿{product.price}
                </span>
              </>
            ) : (
              <span className="text-blue-600 font-bold text-base">
                ฿{product.price}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">4.9</span>
            <span className="text-xs text-gray-400">(19.9k)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
