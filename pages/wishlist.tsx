import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Heart,
  House,
  Loader2,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import useTranslation from "next-translate/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";

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

type MobileTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

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

export default function WishlistPage() {
  const router = useRouter();
  const { lang } = useTranslation("common");
  const { token } = useAuth();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingAll, setClearingAll] = useState(false);

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

  const tabs = useMemo<MobileTabItem[]>(
    () => [
      { href: "/", label: "หน้าหลัก", icon: House },
      { href: "/wishlist", label: "ถูกใจ", icon: Heart },
      { href: "/all-products", label: "ค้นหา", icon: Search },
      { href: "/cart", label: "ตะกร้า", icon: ShoppingCart },
      { href: "/account", label: "บัญชี", icon: UserRound },
    ],
    [],
  );

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
              <section className="pt-2">
                <p className="mb-3 text-[15px] text-[#8a8a8d]">
                  {products.length} รายการที่ถูกใจ
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => {
                    const hasDiscount =
                      typeof product.salePrice === "number" &&
                      product.salePrice < product.price;
                    const price = hasDiscount
                      ? product.salePrice!
                      : product.price;
                    const discountPercent = hasDiscount
                      ? Math.round(
                          ((product.price - price) / product.price) * 100,
                        )
                      : 0;
                    const productName = resolveName(product, lang || "th");

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="overflow-hidden rounded-[20px] border border-[#d5d5d5] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                      >
                        <div className="relative h-[176px] w-full overflow-hidden">
                          <img
                            src={product.imageUrl ?? "/images/placeholder.png"}
                            alt={productName}
                            className="h-full w-full object-cover"
                          />

                          <div className="absolute right-2 top-2">
                            {hasDiscount ? (
                              <span className="rounded-full bg-gradient-to-r from-[#f44336] to-[#d633ff] px-3 py-1 text-[12px] font-bold text-white">
                                ลด {discountPercent}%
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#27b05f] px-3 py-1 text-[12px] font-bold text-white">
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
                            className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow"
                          >
                            <Heart
                              className="h-8 w-8 text-[#8d8d8d]"
                              strokeWidth={2.25}
                            />
                          </button>
                        </div>

                        <div className="px-3 py-2">
                          <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-semibold text-[#2f2f2f]">
                            {productName}
                          </h3>

                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-[30px] font-bold text-[#2f6ef4]">
                              {toCurrency(price)}
                            </span>
                            {hasDiscount ? (
                              <span className="text-[14px] text-[#9a9a9a] line-through">
                                {toCurrency(product.price)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-[#f5b301] text-[#f5b301]" />
                            <span className="text-[15px] text-[#374151]">
                              4.9
                            </span>
                            <span className="text-[13px] text-[#b2b2b2]">
                              (219 รีวิว)
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </main>
        </div>

        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#cfcfd2] bg-[#f8f8f8] md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto grid h-[76px] w-full max-w-[440px] grid-cols-5 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = router.pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 pb-1 ${
                    isActive ? "text-[#2f6ef4]" : "text-[#6b7280]"
                  }`}
                >
                  <Icon
                    className={`h-7 w-7 ${isActive ? "" : "stroke-[1.9]"}`}
                    strokeWidth={isActive ? 2.3 : 2}
                  />
                  <span className="text-[13px] leading-none">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
