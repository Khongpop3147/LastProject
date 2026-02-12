// components/ProductCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product & { stock: number };
  backgroundColor?: string;
  showBadge?: "sale" | "new" | null;
  salePercent?: number;
}

export default function ProductCard({
  product,
  backgroundColor = "bg-gradient-to-br from-orange-400 to-orange-500",
  showBadge = null,
  salePercent = 25,
}: ProductCardProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Check if initially wishlisted (could be improved with global state)
  // For now, we rely on local state or parent prop if we add one later.

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      router.push("/login");
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState); // Optimistic update

    try {
      if (nextState) {
        // Add to wishlist
        await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });
      } else {
        // Remove from wishlist
        await fetch(`/api/wishlist/${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Failed to update wishlist", error);
      setIsWishlisted(!nextState); // Revert on error
    }
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = product.salePrice || product.price;

  // Calculate real discount percentage from prices
  const calculatedDiscountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  // Use calculated discount if available, otherwise use prop
  const discountPercent = hasDiscount ? calculatedDiscountPercent : salePercent;

  const rating = 4.9; // Mock rating
  const reviewCount = 219; // Mock review count

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Image Section with Background Color */}
        <div
          className={`relative ${backgroundColor} aspect-square overflow-hidden`}
        >
          {/* Badge */}
          {showBadge === "sale" && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
              ลด {discountPercent}%
            </div>
          )}
          {showBadge === "new" && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
              ใหม่
            </div>
          )}

          {/* Product Image */}
          <Image
            src={product.imageUrl ?? "/images/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg text-red-600 font-bold z-20">
              สินค้าหมด
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Product Name - 2 lines */}
          <h3 className="text-sm md:text-base font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg md:text-xl font-bold text-blue-600">
              ฿{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ฿{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating Section */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{rating}</span>
            <span className="text-xs text-gray-400">({reviewCount}รีวิว)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
