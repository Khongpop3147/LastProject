// pages/wishlist.tsx
"use client";

import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    imageUrl?: string | null;
    stock: number;
  };
}

export default function WishlistPage() {
  const { t } = useTranslation("common");
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: เชื่อมต่อ API เมื่อ backend พร้อม
  const loadWishlist = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Uncomment when API is ready
      // const res = await fetch("/api/wishlist", {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // const data = await res.json();
      // setItems(data.items || []);
      
      // Mock data for now (ลบออกเมื่อ API พร้อม)
      setItems([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // TODO: เชื่อมต่อ API เมื่อ backend พร้อม
  const removeFromWishlist = async (itemId: string) => {
    if (!token) return;
    
    try {
      // TODO: Uncomment when API is ready
      // await fetch("/api/wishlist", {
      //   method: "DELETE",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ itemId }),
      // });
      
      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error(error);
    }
  };

  // TODO: เชื่อมต่อ API cart เมื่อต้องการ
  const addToCart = async (productId: string) => {
    if (!token) return;
    
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      
      if (res.ok) {
        alert("เพิ่มสินค้าลงตระกร้าแล้ว");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [token]);

  // ถ้ายังไม่ล็อกอิน
  if (!token) {
    return (
      <Layout title="รายการโปรด">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-md mx-auto px-4 py-4 flex items-center">
              <Link href="/" className="mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold">รายการโปรด</h1>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ยังไม่มีรายการโปรด
            </h2>
            <p className="text-gray-500 text-center mb-6">
              กดหัวใจเพื่อเพิ่มสินค้าที่คุณชอบ
            </p>
            <Link
              href="/all-products"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ไปสินค้า
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="รายการโปรด">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold">รายการโปรด</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ยังไม่มีรายการโปรด
            </h2>
            <p className="text-gray-500 text-center mb-6">
              กดหัวใจเพื่อเพิ่มสินค้าที่คุณชอบ
            </p>
            <Link
              href="/all-products"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ไปสินค้า
            </Link>
          </div>
        ) : (
          /* Wishlist Items */
          <div className="flex-1 pb-20">
            <div className="max-w-md mx-auto px-4 py-4 space-y-4">
              {items.map((item) => {
                const price = item.product.salePrice ?? item.product.price;
                const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
                  >
                    {/* Product Image */}
                    <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.imageUrl ?? "/images/placeholder.png"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-semibold text-blue-600">
                            ฿{price.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                              ฿{item.product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => addToCart(item.product.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          เพิ่มลงตระกร้า
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
