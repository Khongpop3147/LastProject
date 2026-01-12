// pages/cart.tsx
"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    imageUrl?: string | null;
    stock: number;
  };
}

export default function CartPage() {
  const { t, lang } = useTranslation("common");
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0); // จะดึงจาก backend

  const loadCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?locale=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
      
      // TODO: ดึงค่าจัดส่งจาก backend
      // setDeliveryFee(data.deliveryFee || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!token) return;
    if (quantity < 1) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (quantity > item.product.stock) {
      alert(`สินค้ามีเพียง ${item.product.stock} ชิ้น`);
      return;
    }

    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId, quantity }),
    });
    
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    } else {
      const err = await res.json();
      alert("เกิดข้อผิดพลาด: " + err.error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!token) return;
    
    await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId }),
    });
    loadCart();
  };

  useEffect(() => {
    loadCart();
  }, [token, lang]);

  const subtotal = items.reduce((sum, item) => {
    const unit = item.product.salePrice ?? item.product.price;
    return sum + unit * item.quantity;
  }, 0);

  const total = subtotal + deliveryFee;

  // ถ้ายังไม่ล็อกอิน
  if (!token) {
    return (
      <Layout title="ตระกร้า">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-md mx-auto px-4 py-4 flex items-center">
              <Link href="/" className="mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold">ตระกร้า</h1>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่พบสินค้า
            </h2>
            <p className="text-gray-500 text-center mb-6">
              ไม่มีของในตะกร้า
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
    <Layout title="ตระกร้า">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold">ตระกร้า</h1>
            </div>
            {items.length > 0 && (
              <span className="text-sm text-gray-500">{items.length} รายการ</span>
            )}
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
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่พบสินค้า
            </h2>
            <p className="text-gray-500 text-center mb-6">
              ไม่มีของในตะกร้า
            </p>
            <Link
              href="/all-products"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ไปสินค้า
            </Link>
          </div>
        ) : (
          /* Cart Items */
          <div className="flex-1 flex flex-col pb-20">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-md mx-auto px-4 py-4 space-y-3">
                {items.map((item) => {
                  const unit = item.product.salePrice ?? item.product.price;
                  const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;
                  const lineTotal = unit * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm p-4 flex gap-3"
                    >
                      {/* Product Image */}
                      <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.product.imageUrl ?? "/images/placeholder.png"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 text-sm"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-base font-semibold text-blue-600">
                              ฿{unit.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ฿{item.product.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white border-t">
              <div className="max-w-md mx-auto px-4 py-4">
                {/* Price Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ราคาสินค้า</span>
                    <span className="text-gray-900">฿{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ค่าจัดส่ง</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : "text-gray-900"}>
                      {deliveryFee === 0 ? "ฟรี" : `฿${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">รวมทั้งหมด</span>
                    <span className="font-bold text-xl text-blue-600">
                      ฿{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                >
                  สั่งสินค้า
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
