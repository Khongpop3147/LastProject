"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
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
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(isInWishlist(product.id, user?.id));
  }, [product.id, user?.id]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
    }, user?.id);
    setIsWishlisted(next);
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = product.salePrice || product.price;

  const calculatedDiscountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const discountPercent = hasDiscount ? calculatedDiscountPercent : salePercent;

  const rating = 4.9;
  const reviewCount = 219;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
        <div className={`relative ${backgroundColor} aspect-square overflow-hidden`}>
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
              ฿{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ฿{product.price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-700">{rating}</span>
            <span className="text-xs text-gray-400">({reviewCount})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
