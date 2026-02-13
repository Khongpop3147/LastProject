// pages/cart.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  ShoppingCart,
  Store,
  Ticket,
  Trash2,
} from "lucide-react";
import useTranslation from "next-translate/useTranslation";
import { useAuth } from "@/context/AuthContext";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";

type ProductTranslation = {
  locale: string;
  name: string;
  description?: string | null;
};

interface CartItem {
  id: string;
  quantity: number;
  sellerName?: string;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    imageUrl?: string | null;
    stock: number;
    translations?: ProductTranslation[];
  };
}

function resolveName(product: CartItem["product"], locale: string) {
  const exact = product.translations?.find(
    (item) => item.locale === locale,
  )?.name;
  if (exact) return exact;
  if (product.translations?.[0]?.name) return product.translations[0].name;
  return product.name || "สินค้า";
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

export default function CartPage() {
  const router = useRouter();
  const { lang } = useTranslation("common");
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectionInitialized, setSelectionInitialized] = useState(false);

  const loadCart = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cart?locale=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch cart", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, lang]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (!token) {
      setSelectedItemIds(new Set());
      setSelectionInitialized(false);
    }
  }, [token]);

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!token) return;
    if (quantity < 1) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (quantity > item.product.stock) {
      alert(`สินค้าในคลังมีเพียง ${item.product.stock} ชิ้น`);
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
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      );
    } else {
      const err = await res.json();
      alert("เกิดข้อผิดพลาด: " + err.error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!token) return;

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error("Failed to remove cart item", error);
      await loadCart();
    }
  };

  const removeSelectedItems = async () => {
    if (!token) return;

    const idsToRemove = items
      .filter((item) => selectedItemIds.has(item.id))
      .map((item) => item.id);

    if (idsToRemove.length === 0) return;

    const removeSet = new Set(idsToRemove);
    setItems((prev) => prev.filter((item) => !removeSet.has(item.id)));
    setSelectedItemIds(new Set());

    try {
      await Promise.all(
        idsToRemove.map(async (itemId) => {
          const res = await fetch("/api/cart", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ itemId }),
          });
          if (!res.ok) {
            throw new Error("Failed to remove selected item");
          }
        }),
      );
    } catch (error) {
      console.error("Failed to remove selected cart items", error);
      await loadCart();
    }
  };

  useEffect(() => {
    if (!selectionInitialized) {
      if (items.length === 0) return;
      setSelectedItemIds(new Set(items.map((item) => item.id)));
      setSelectionInitialized(true);
      return;
    }

    setSelectedItemIds((prev) => {
      const next = new Set<string>();
      for (const item of items) {
        if (prev.has(item.id)) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [items, selectionInitialized]);

  const groupedBySeller = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of items) {
      const seller = item.sellerName?.trim() || "ร้านทั่วไป";
      if (!groups.has(seller)) {
        groups.set(seller, []);
      }
      groups.get(seller)!.push(item);
    }
    return Array.from(groups.entries()).map(([sellerName, groupItems]) => {
      const selectedCount = groupItems.filter((item) =>
        selectedItemIds.has(item.id),
      ).length;
      const selectedSubtotal = groupItems
        .filter((item) => selectedItemIds.has(item.id))
        .reduce((sum, item) => {
          const unit = item.product.salePrice ?? item.product.price;
          return sum + unit * item.quantity;
        }, 0);

      return {
        sellerName,
        items: groupItems,
        selectedCount,
        selectedSubtotal,
        allSelected:
          selectedCount === groupItems.length && groupItems.length > 0,
      };
    });
  }, [items, selectedItemIds]);

  const selectedItemsCount = items.filter((item) =>
    selectedItemIds.has(item.id),
  ).length;

  const selectedTotal = items
    .filter((item) => selectedItemIds.has(item.id))
    .reduce((sum, item) => {
      const unit = item.product.salePrice ?? item.product.price;
      return sum + unit * item.quantity;
    }, 0);

  const cartQuantityCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleItemSelected = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSellerSelected = (sellerName: string) => {
    const targetGroup = groupedBySeller.find(
      (group) => group.sellerName === sellerName,
    );
    if (!targetGroup) return;

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (targetGroup.allSelected) {
        for (const item of targetGroup.items) {
          next.delete(item.id);
        }
      } else {
        for (const item of targetGroup.items) {
          next.add(item.id);
        }
      }
      return next;
    });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Exit edit mode and default back to selecting all items for checkout.
      setIsEditing(false);
      setSelectedItemIds(new Set(items.map((item) => item.id)));
      return;
    }

    setIsEditing(true);
  };

  if (!token) {
    return (
      <>
        <Head>
          <title>ตะกร้า</title>
        </Head>

        <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
          <div className="mx-auto w-full max-w-[440px] md:max-w-7xl">
            <header className="sticky top-16 sm:top-20 md:top-24 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4] md:bg-white md:shadow-sm">
              <div className="flex h-[80px] md:h-[100px] items-center px-4 md:px-6">
                <button
                  type="button"
                  aria-label="ย้อนกลับ"
                  onClick={handleBack}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#222b3a]"
                >
                  <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
                </button>

                <h1 className="ml-4 text-[28px] md:text-[32px] font-extrabold leading-none tracking-tight text-black">
                  ตะกร้า
                </h1>
              </div>
            </header>

            <main className="px-4 md:px-6 pb-8 md:pb-12">
              <section className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#dedede]">
                  <ShoppingCart
                    className="h-[42px] w-[42px] text-[#8f8f8f]"
                    strokeWidth={1.8}
                  />
                </div>
                <h2 className="text-[32px] font-extrabold leading-tight text-black">
                  ไม่มีสินค้า
                </h2>
                <p className="mt-1 text-[15px] text-[#6b7280]">
                  ไม่มีสินค้าในตะกร้า
                </p>
                <Link
                  href="/login"
                  className="mt-3 rounded-2xl bg-[#2f6ef4] px-8 py-2.5 text-[16px] font-medium text-white"
                >
                  เข้าสู่ระบบ
                </Link>
              </section>
            </main>
          </div>

          <div className="md:hidden">
            <MobileShopBottomNav activePath="/cart" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>ตะกร้า</title>
      </Head>

      <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px] md:max-w-7xl">
          <header className="sticky top-16 sm:top-20 md:top-24 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4] md:bg-white md:shadow-sm">
            <div className="flex h-[80px] md:h-[100px] items-center justify-between px-4 md:px-6">
              <button
                type="button"
                aria-label="ย้อนกลับ"
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#222b3a]"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <h1 className="ml-4 text-[28px] font-extrabold leading-none tracking-tight text-black">
                ตะกร้า{items.length > 0 ? ` (${cartQuantityCount})` : ""}
              </h1>

              <button
                type="button"
                onClick={handleToggleEdit}
                className="ml-auto text-[20px] text-[#2f2f2f]"
              >
                {isEditing ? "เสร็จสิ้น" : "แก้ไข"}
              </button>
            </div>
          </header>

          <main className="px-4 md:px-6 pb-[164px] md:pb-12">
            {loading ? (
              <div className="flex h-[420px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#2f6ef4]" />
              </div>
            ) : items.length === 0 ? (
              <section className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#dedede]">
                  <ShoppingCart
                    className="h-[42px] w-[42px] text-[#8f8f8f]"
                    strokeWidth={1.8}
                  />
                </div>
                <h2 className="text-[32px] font-extrabold leading-tight text-black">
                  ไม่มีสินค้า
                </h2>
                <p className="mt-1 text-[15px] text-[#6b7280]">
                  ไม่มีสินค้าในตะกร้า
                </p>
                <Link
                  href="/all-products"
                  className="mt-3 rounded-2xl bg-[#2f6ef4] px-8 py-2.5 text-[16px] font-medium text-white"
                >
                  ไปดูสินค้า
                </Link>
              </section>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8">
                <section className="space-y-4 pt-2">
                  {groupedBySeller.map((group) => (
                    <div
                      key={group.sellerName}
                      className="overflow-hidden rounded-[20px] border border-[#dddddd] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-center gap-2 border-b border-[#efefef] px-3 py-3">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={group.allSelected}
                            onChange={() =>
                              toggleSellerSelected(group.sellerName)
                            }
                            className="h-5 w-5 flex-shrink-0 accent-[#f25d3d]"
                          />
                        ) : null}
                        <Store className="h-4 w-4 flex-shrink-0 text-[#666]" />
                        <div className="min-w-0 flex flex-1 items-center text-[17px] font-semibold text-[#252525]">
                          <span className="truncate">{group.sellerName}</span>
                          <ChevronRight className="ml-1 h-4 w-4 flex-shrink-0 text-[#8b8b8b]" />
                        </div>
                      </div>

                      <div className="space-y-3 px-3 py-3">
                        {group.items.map((item) => {
                          const unit =
                            item.product.salePrice ?? item.product.price;
                          const productName = resolveName(
                            item.product,
                            lang || "th",
                          );
                          const hasDiscount =
                            typeof item.product.salePrice === "number" &&
                            item.product.salePrice < item.product.price;

                          return (
                            <div
                              key={item.id}
                              className={`flex items-start ${isEditing ? "gap-2" : "gap-3"}`}
                            >
                              {isEditing ? (
                                <input
                                  type="checkbox"
                                  checked={selectedItemIds.has(item.id)}
                                  onChange={() => toggleItemSelected(item.id)}
                                  className="mt-9 h-5 w-5 flex-shrink-0 accent-[#f25d3d]"
                                />
                              ) : null}

                              <div className="relative mt-1 h-[96px] w-[96px] flex-shrink-0 overflow-hidden rounded-[12px] border border-[#e7e7e7]">
                                <img
                                  src={
                                    item.product.imageUrl ??
                                    "/images/placeholder.png"
                                  }
                                  alt={productName}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/products/${item.product.id}`}
                                  onClick={(event) => {
                                    if (isEditing) event.preventDefault();
                                  }}
                                  className={`line-clamp-2 text-[16px] font-medium leading-snug text-[#2f2f2f] ${
                                    isEditing ? "pointer-events-none" : ""
                                  }`}
                                >
                                  {productName}
                                </Link>

                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.id,
                                          item.quantity - 1,
                                        )
                                      }
                                      disabled={item.quantity <= 1}
                                      className="h-9 w-9 rounded-[10px] bg-[#f2f2f2] text-[22px] text-[#666] disabled:opacity-40"
                                    >
                                      -
                                    </button>

                                    <span className="w-7 text-center text-[20px] font-medium text-[#333]">
                                      {item.quantity}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.id,
                                          item.quantity + 1,
                                        )
                                      }
                                      disabled={
                                        item.quantity >= item.product.stock
                                      }
                                      className="h-9 w-9 rounded-[10px] bg-[#f2f2f2] text-[22px] text-[#666] disabled:opacity-40"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-2 flex items-end justify-between gap-2">
                                  <div className="min-w-0 flex items-end gap-1">
                                    <span className="text-[30px] font-extrabold leading-none text-[#f05a2b]">
                                      {toCurrency(unit)}
                                    </span>
                                    {hasDiscount && (
                                      <span className="truncate text-[15px] text-[#b3b3b3] line-through">
                                        {toCurrency(item.product.price)}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    aria-label="ลบออกจากตะกร้า"
                                    onClick={() => removeItem(item.id)}
                                    className={`ml-1 flex-shrink-0 rounded-full p-1 hover:bg-[#fff1ef] ${
                                      isEditing ? "" : "hidden"
                                    }`}
                                  >
                                    <Trash2
                                      className="h-6 w-6 text-[#ff5858]"
                                      strokeWidth={2}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push("/coupons")}
                        className="flex w-full items-center gap-2 border-t border-[#efefef] px-3 py-3 text-left text-[18px] text-[#666]"
                      >
                        <Ticket className="h-5 w-5 text-[#f25d3d]" />
                        เพิ่มโค้ดร้านค้า
                        <ChevronRight className="ml-auto h-5 w-5 text-[#9a9a9a]" />
                      </button>
                    </div>
                  ))}
                </section>

                {/* Desktop Summary Sidebar */}
                <aside className="hidden lg:block">
                  <div className="sticky top-32 rounded-[20px] border border-[#dddddd] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                    <h2 className="text-[20px] font-bold text-[#2f2f2f] mb-4">
                      สรุปคำสั่งซื้อ
                    </h2>

                    {isEditing ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-[15px]">
                            <span className="text-[#6b7280]">เลือกแล้ว</span>
                            <span className="font-semibold">
                              {selectedItemsCount} รายการ
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[16px]">
                            <span className="font-bold text-[#2f2f2f]">
                              รวม
                            </span>
                            <span className="font-bold text-[#f05a2b]">
                              {toCurrency(selectedTotal)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={selectedItemsCount === 0}
                          onClick={removeSelectedItems}
                          className="w-full rounded-xl bg-[#ff5858] py-3 text-[17px] font-semibold text-white hover:bg-[#e94949] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          ลบสินค้าที่เลือก
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-[15px] text-[#6b7280]">
                            <span>ราคาสินค้า</span>
                            <span className="text-[#4b5563] font-medium">
                              {toCurrency(selectedTotal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[15px] text-[#6b7280]">
                            <span>ค่าจัดส่ง</span>
                            <span className="font-semibold text-[#27b05f]">
                              ฟรี
                            </span>
                          </div>
                          <div className="border-t border-[#e0e0e0] pt-3 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[18px] font-bold text-[#2f2f2f]">
                                รวมทั้งหมด
                              </span>
                              <span className="text-[26px] font-extrabold text-[#2f6ef4]">
                                {toCurrency(selectedTotal)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={selectedItemsCount === 0}
                          onClick={() => router.push("/checkout")}
                          className="w-full rounded-xl bg-[#2f6ef4] py-3 text-[17px] font-semibold text-white hover:bg-[#2558c7] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          สั่งสินค้า
                        </button>
                      </>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </main>
        </div>

        {!loading && items.length > 0 && (
          <div
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d8d8d8] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
            }}
          >
            <div className="mx-auto w-full max-w-[440px] px-4 pb-2 pt-1.5">
              {isEditing ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-[15px] text-[#6b7280]">
                    <span>เลือกแล้ว {selectedItemsCount} รายการ</span>
                    <span className="font-semibold text-[#f05a2b]">
                      {toCurrency(selectedTotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={selectedItemsCount === 0}
                    onClick={removeSelectedItems}
                    className="w-full rounded-2xl bg-[#ff5858] py-2.5 text-[18px] font-medium leading-none text-white hover:bg-[#e94949] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ลบสินค้าที่เลือก
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[14px] text-[#6b7280]">
                      <span>ราคาสินค้า</span>
                      <span className="text-[#4b5563]">
                        {toCurrency(selectedTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[14px] text-[#6b7280]">
                      <span>ค่าจัดส่ง</span>
                      <span className="font-medium text-[#27b05f]">ฟรี</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[17px] font-extrabold text-[#2f2f2f]">
                        รวมทั้งหมด
                      </span>
                      <span className="text-[24px] font-extrabold text-[#2f6ef4]">
                        {toCurrency(selectedTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedItemsCount === 0}
                    onClick={() => router.push("/checkout")}
                    className="mt-2 w-full rounded-2xl bg-[#2f6ef4] py-2.5 text-[18px] font-medium leading-none text-white hover:bg-[#2558c7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    สั่งสินค้า
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {(loading || items.length === 0) && (
          <div className="md:hidden">
            <MobileShopBottomNav activePath="/cart" />
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
