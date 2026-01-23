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
<<<<<<< HEAD
  product: Product;
=======
  product: Product & { stock: number };
  backgroundColor?: string;
  showBadge?: "sale" | "new" | null;
  salePercent?: number;
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
}

export default function ProductCard({ 
  product, 
  backgroundColor = "bg-gradient-to-br from-orange-400 to-orange-500",
  showBadge = null,
  salePercent = 25
}: ProductCardProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      router.push("/login");
      return;
    }
<<<<<<< HEAD
    setAdding(true);
    try {
      const cartRes = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cartRes.ok) throw new Error("Cannot fetch cart");
      const { items: cartItems } = await cartRes.json();
      const currentQuantity =
        (cartItems as { productId: string; quantity: number }[]).find(
          (item) => item.productId === product.id
        )?.quantity ?? 0;
      if (currentQuantity + 1 > product.stock) {
        alert("จำนวนสินค้าเกินสต็อกที่มี");
        setAdding(false);
        return;
      }
      const addRes = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!addRes.ok) throw new Error("Failed to add to cart");
      router.push("/cart");
    } catch {
      alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    } finally {
      setAdding(false);
    }
=======
    
    setIsWishlisted(!isWishlisted);
    // TODO: Add API call to add/remove from wishlist
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
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
<<<<<<< HEAD
    <div className="w-full max-w-[200px] h-full bg-white rounded-2xl p-4 flex flex-col space-y-4 transition-shadow duration-300 hover:shadow-lg">
      {/* ส่วนบนยืดเต็มความสูงที่เหลือ */}
      <Link
        href={`/products/${product.id}`}
        className="group flex-1 flex flex-col space-y-2 relative z-10"
      >
        {/* รูป */}
        <div className="relative w-full pt-[100%] rounded-lg overflow-hidden">
=======
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Image Section with Background Color */}
        <div className={`relative ${backgroundColor} aspect-square overflow-hidden`}>
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
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
          <Image
            src={product.imageUrl ?? "/images/placeholder.png"}
            alt={product.name}
            fill
<<<<<<< HEAD
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* ชื่อสินค้า: ขึ้นได้สูงสุด 2 บรรทัด, บล็อคความสูงเท่ากัน */}
        <h3 className="text-base font-normal text-black text-left line-clamp-2 min-h-12 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>

        {/* รายละเอียด: ขึ้นได้แค่ 1 บรรทัด, บล็อคความสูงเท่ากัน */}
        {product.description && (
          <p className="text-gray-500 text-sm line-clamp-1 text-left min-h-5">
            {product.description}
          </p>
        )}

        {/* ราคาสินค้า: จัดชิดซ้าย, บล็อคความสูงเท่ากัน */}
        <div className="flex items-center justify-start space-x-2 min-h-6 mt-auto">
          {product.salePrice != null ? (
            <>
              <span className="text-gray-400 line-through text-sm font-normal">
                ฿{product.price}
              </span>
              <span className="text-red-600 text-lg font-normal">
                ฿{product.salePrice}
              </span>
            </>
          ) : (
            <span className="text-black text-lg font-normal">
              ฿{product.price}
            </span>
          )}
        </div>
      </Link>

      {/* ปุ่มหยิบใส่รถเข็น */}
      {product.stock === 0 ? (
        <button
          disabled
          className="mt-2 w-full py-2 sm:py-3 rounded-full bg-gray-300 text-gray-700 cursor-not-allowed"
        >
          สินค้าหมด
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`
            mt-2
            w-full
            flex items-center justify-center space-x-2
            bg-green-600 text-white
            py-2 sm:py-3
            text-sm sm:text-base
            rounded-full hover:bg-green-700 transition
            ${adding ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <Plus size={16} />
          <span>{adding ? "กำลังเพิ่ม..." : "หยิบใส่รถเข็น"}</span>
        </button>
      )}
    </div>
=======
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />

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
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
  );
}
