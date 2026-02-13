"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
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

  const loadCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?locale=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
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
      alert(t("cart.exceedStock", { stock: item.product.stock }));
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
      alert(t("cart.error") + ": " + err.error);
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

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unit = item.product.salePrice ?? item.product.price;
        return sum + unit * item.quantity;
      }, 0),
    [items]
  );

  if (!token) {
    return (
      <Layout title={t("cart.title")}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <ShoppingCart size={52} className="mx-auto text-gray-400 mb-4" />
          <p className="mb-4">
            {t("cart.loginPrompt")} {" "}
            <Link href="/login" className="text-green-600 hover:underline">
              {t("cart.login")}
            </Link>
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t("cart.title")}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold">{t("cart.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} item(s) in your cart</p>
        </div>

        {loading ? (
          <p>{t("cart.loading")}</p>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="mb-4">{t("cart.empty")}</p>
            <Link
              href="/all-products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {t("cart.browse")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
            <div className="space-y-4 md:space-y-5">
              {items.map((item) => {
                const unit = item.product.salePrice ?? item.product.price;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 flex flex-col sm:flex-row gap-4"
                  >
                    <div className="w-full sm:w-28 h-40 sm:h-28 relative rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.product.imageUrl ?? "/images/placeholder.png"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-semibold text-base md:text-lg text-gray-900 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("cart.unitPrice", { price: unit })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="w-14 border border-gray-200 text-center rounded-lg h-8"
                            value={item.quantity}
                            min={1}
                            max={item.product.stock}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                Math.min(Math.max(1, +e.target.value), item.product.stock)
                              )
                            }
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-lg text-gray-900">
                            {t("cart.lineTotal", { total: unit * item.quantity })}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-1 text-sm text-red-600 hover:underline"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Order summary</h2>

                <div className="space-y-2 text-sm border-b border-gray-100 pb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{t("cart.currency", { amount: subtotal })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-semibold">{t("cart.subtotal")}</span>
                  <span className="text-2xl font-bold text-green-700">
                    {t("cart.currency", { amount: subtotal })}
                  </span>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="mt-5 w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  {t("cart.checkout")}
                </button>

                <Link
                  href="/all-products"
                  className="mt-3 block text-center text-sm text-blue-600 hover:underline"
                >
                  Continue shopping
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
