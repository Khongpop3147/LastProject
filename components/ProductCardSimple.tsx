"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const hasDiscount =
    product.salePrice != null && product.salePrice < product.price;

  useEffect(() => {
    setIsFavorite(isInWishlist(product.id, user?.id));
  }, [product.id, user?.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      user?.id,
    );
    setIsFavorite(next);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
        <div className="relative w-full aspect-square">
          <Image
            src={product.imageUrl ?? "/images/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover"
          />

          {showBadge === "new" && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          )}
          {showBadge === "sale" && salePercent && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{salePercent}%
            </div>
          )}

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

        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            {hasDiscount ? (
              <>
                <span className="text-red-600 font-bold text-base">
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
        </div>
      </div>
    </Link>
  );
}
