import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import useTranslation from "next-translate/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";

type ProductTranslation = {
  locale: string;
  name: string;
  description?: string | null;
};

type WishlistProduct = {
  id: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  stock?: number;
  translations?: ProductTranslation[];
  wishlistedAt?: string;
};

type QuickFilter = "all" | "discount" | "inStock";
type SortKey = "latest" | "priceLowToHigh" | "priceHighToLow" | "discountHigh";

function resolveName(product: WishlistProduct, locale: string) {
  const exact = product.translations?.find(
    (item) => item.locale === locale,
  )?.name;
  if (exact) return exact;
  if (product.translations?.[0]?.name) return product.translations[0].name;
  return "สินค้า";
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function getDisplayPrice(product: WishlistProduct) {
  if (typeof product.salePrice === "number" && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

function getDiscountPercent(product: WishlistProduct) {
  if (typeof product.salePrice !== "number" || product.salePrice >= product.price) {
    return 0;
  }

  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

function getWishlistedTimestamp(product: WishlistProduct) {
  if (!product.wishlistedAt) return 0;
  const ts = new Date(product.wishlistedAt).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export default function WishlistPage() {
  const router = useRouter();
  const { lang } = useTranslation("common");
  const { token } = useAuth();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingAll, setClearingAll] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("latest");

  const loadWishlist = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setProducts([]);
        return;
      }

      const data = (await res.json()) as WishlistProduct[];
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  const handleRemove = async (productId: string) => {
    if (!token) {
      router.push("/login");
      return;
    }

    setProducts((prev) => prev.filter((product) => product.id !== productId));
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        await loadWishlist();
      }
    } catch (error) {
      console.error("Failed to remove wishlist item", error);
      await loadWishlist();
    }
  };

  const handleClearAll = async () => {
    if (!token || products.length === 0 || clearingAll) return;
    if (!window.confirm("ต้องการลบรายการโปรดทั้งหมดใช่หรือไม่?")) return;

    setClearingAll(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts([]);
      } else {
        await loadWishlist();
      }
    } catch (error) {
      console.error("Failed to clear wishlist", error);
      await loadWishlist();
    } finally {
      setClearingAll(false);
    }
  };

  const visibleProducts = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const name = resolveName(product, lang || "th");
      const matchesKeyword =
        keyword.length === 0 || name.toLowerCase().includes(keyword);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "discount" && getDiscountPercent(product) > 0) ||
        (activeFilter === "inStock" && (product.stock ?? 0) > 0);

      return matchesKeyword && matchesFilter;
    });

    filtered.sort((a, b) => {
      if (sortBy === "latest") {
        return getWishlistedTimestamp(b) - getWishlistedTimestamp(a);
      }

      if (sortBy === "priceLowToHigh") {
        return getDisplayPrice(a) - getDisplayPrice(b);
      }

      if (sortBy === "priceHighToLow") {
        return getDisplayPrice(b) - getDisplayPrice(a);
      }

      const discountGap = getDiscountPercent(b) - getDiscountPercent(a);
      if (discountGap !== 0) return discountGap;
      return getWishlistedTimestamp(b) - getWishlistedTimestamp(a);
    });

    return filtered;
  }, [activeFilter, lang, products, searchText, sortBy]);

  const hasActiveControls =
    searchText.trim().length > 0 || activeFilter !== "all" || sortBy !== "latest";

  const resetControls = () => {
    setSearchText("");
    setActiveFilter("all");
    setSortBy("latest");
  };

  return (
    <>
      <Head>
        <title>รายการโปรด</title>
      </Head>

      <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
            <div className="flex h-[80px] items-center px-4">
              <button
                type="button"
                aria-label="ย้อนกลับ"
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#222b3a]"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <h1 className="ml-4 text-[28px] font-extrabold leading-none tracking-tight text-black">
                รายการโปรด
              </h1>

              {products.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="ml-auto flex items-center gap-1 text-[15px] text-[#ff3b30] disabled:opacity-60"
                  disabled={clearingAll}
                >
                  {clearingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  ลบทิ้งหมด
                </button>
              ) : null}
            </div>
          </header>

          <main className="px-4 pb-[98px]">
            {loading ? (
              <div className="flex h-[420px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#2f6ef4]" />
              </div>
            ) : products.length === 0 ? (
              <section className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#dedede]">
                  <Heart
                    className="h-[42px] w-[42px] text-[#8f8f8f]"
                    strokeWidth={1.8}
                  />
                </div>
                <h2 className="text-[32px] font-extrabold leading-tight text-black">
                  ยังไม่มีรายการโปรด
                </h2>
                <p className="mt-1 text-[15px] text-[#6b7280]">
                  กดหัวใจเพื่อเพิ่มสินค้าที่ชอบ
                </p>
                <Link
                  href="/all-products"
                  className="mt-3 rounded-2xl bg-[#2f6ef4] px-8 py-2.5 text-[16px] font-medium text-white"
                >
                  ไปดูสินค้า
                </Link>
              </section>
            ) : (
              <>
                <section className="sticky top-[80px] z-30 -mx-4 border-b border-[#d8d8db] bg-[#f3f3f4] px-4 pb-3 pt-2">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#757575]"
                      strokeWidth={2.2}
                    />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="ค้นหารายการโปรด"
                      className="h-11 w-full rounded-xl border border-[#d8d8db] bg-white pl-10 pr-10 text-[15px] text-[#2f2f2f] outline-none placeholder:text-[#9ca3af] focus:border-[#2f6ef4]"
                    />
                    {searchText.trim().length > 0 ? (
                      <button
                        type="button"
                        aria-label="ล้างคำค้นหา"
                        onClick={() => setSearchText("")}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f0f0f1] text-[#6b7280]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveFilter("all")}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
                          activeFilter === "all"
                            ? "bg-[#2f6ef4] text-white"
                            : "bg-[#e5e7eb] text-[#4b5563]"
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter("discount")}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
                          activeFilter === "discount"
                            ? "bg-[#2f6ef4] text-white"
                            : "bg-[#e5e7eb] text-[#4b5563]"
                        }`}
                      >
                        ลดราคา
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter("inStock")}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
                          activeFilter === "inStock"
                            ? "bg-[#2f6ef4] text-white"
                            : "bg-[#e5e7eb] text-[#4b5563]"
                        }`}
                      >
                        พร้อมส่ง
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as SortKey)}
                      className="ml-auto h-9 min-w-[130px] rounded-xl border border-[#d8d8db] bg-white px-3 text-[13px] font-medium text-[#4b5563] outline-none focus:border-[#2f6ef4]"
                    >
                      <option value="latest">ล่าสุด</option>
                      <option value="discountHigh">ลดมากสุด</option>
                      <option value="priceLowToHigh">ราคาต่ำ-สูง</option>
                      <option value="priceHighToLow">ราคาสูง-ต่ำ</option>
                    </select>
                  </div>
                </section>

                <section className="pb-2 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[14px] text-[#6b7280]">
                      แสดง {visibleProducts.length} จาก {products.length} รายการ
                    </p>
                    {hasActiveControls ? (
                      <button
                        type="button"
                        onClick={resetControls}
                        className="text-[13px] font-semibold text-[#2f6ef4]"
                      >
                        ล้างตัวกรอง
                      </button>
                    ) : null}
                  </div>

                  {visibleProducts.length === 0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d6d6d6] bg-white px-6 text-center">
                      <Search className="h-10 w-10 text-[#9aa1ad]" />
                      <h3 className="mt-3 text-[24px] font-bold text-[#1f2937]">
                        ไม่พบรายการที่ตรงกัน
                      </h3>
                      <p className="mt-1 text-[14px] text-[#6b7280]">
                        ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองใหม่
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {visibleProducts.map((product) => {
                        const discountPercent = getDiscountPercent(product);
                        const hasDiscount = discountPercent > 0;
                        const displayPrice = getDisplayPrice(product);
                        const productName = resolveName(product, lang || "th");

                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="overflow-hidden rounded-[18px] border border-[#d7d7d9] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.14)]"
                          >
                            <div className="relative h-[152px] w-full overflow-hidden">
                              <img
                                src={product.imageUrl ?? "/images/placeholder.png"}
                                alt={productName}
                                className="h-full w-full object-cover"
                              />

                              <div className="absolute right-2 top-2">
                                {hasDiscount ? (
                                  <span className="rounded-full bg-gradient-to-r from-[#f44336] to-[#d633ff] px-2.5 py-1 text-[12px] font-bold text-white">
                                    ลด {discountPercent}%
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[#27b05f] px-2.5 py-1 text-[12px] font-bold text-white">
                                    ใหม่
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                aria-label="ลบออกจากรายการโปรด"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleRemove(product.id);
                                }}
                                className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow"
                              >
                                <Heart
                                  className="h-7 w-7 text-[#8d8d8d]"
                                  strokeWidth={2.25}
                                />
                              </button>
                            </div>

                            <div className="px-3 pb-3 pt-2">
                              <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-semibold leading-[1.25] text-[#2f2f2f]">
                                {productName}
                              </h3>

                              <div className="mt-1.5 flex items-end gap-2">
                                <span className="text-[24px] font-bold leading-none text-[#2f6ef4]">
                                  {toCurrency(displayPrice)}
                                </span>
                                {hasDiscount ? (
                                  <span className="pb-0.5 text-[14px] text-[#9a9a9a] line-through">
                                    {toCurrency(product.price)}
                                  </span>
                                ) : null}
                              </div>

                              {(product.stock ?? 0) <= 0 ? (
                                <p className="mt-1.5 text-[12px] font-semibold text-[#ef4444]">
                                  สินค้าหมด
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
        <MobileShopBottomNav activePath="/wishlist" />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
