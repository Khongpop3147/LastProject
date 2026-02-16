import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import { goBackOrPush } from "@/lib/navigation";
import type { Product } from "@/types/product";

type DiscountFilter = "all" | 10 | 20 | 30 | 40 | 50;

type SaleProduct = Product & {
  discountPercent: number;
  discountBucket: DiscountFilter | 0;
};

type SalePageProps = {
  products: SaleProduct[];
  initialFilter: DiscountFilter;
};

const numericDiscountFilters = [10, 20, 30, 40, 50] as const;

const cardBackgrounds = [
  "bg-gradient-to-br from-orange-400 to-orange-500",
  "bg-gradient-to-br from-pink-300 to-rose-300",
  "bg-gradient-to-br from-amber-300 to-yellow-400",
  "bg-gradient-to-br from-red-400 to-orange-500",
  "bg-gradient-to-br from-cyan-400 to-blue-500",
];

const filterTabs: Array<{ key: DiscountFilter; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: 10, label: "10%" },
  { key: 20, label: "20%" },
  { key: 30, label: "30%" },
  { key: 40, label: "40%" },
  { key: 50, label: "50%" },
];

function parseDiscountFilter(
  value: string | string[] | undefined,
): DiscountFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "all") return "all";
  if (typeof raw !== "string") return null;

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;

  return numericDiscountFilters.includes(
    numeric as (typeof numericDiscountFilters)[number],
  )
    ? (numeric as DiscountFilter)
    : null;
}

function getDiscountBucket(discountPercent: number): DiscountFilter | 0 {
  if (discountPercent >= 50) return 50;
  if (discountPercent >= 40) return 40;
  if (discountPercent >= 30) return 30;
  if (discountPercent >= 20) return 20;
  if (discountPercent >= 10) return 10;
  return 0;
}

export default function SalePage({
  products,
  initialFilter,
}: SalePageProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [activeFilter, setActiveFilter] = useState<DiscountFilter>(
    () => parseDiscountFilter(router.query.discount) ?? initialFilter,
  );

  useEffect(() => {
    const filterFromQuery = parseDiscountFilter(router.query.discount);
    setActiveFilter(filterFromQuery ?? initialFilter);
  }, [initialFilter, router.query.discount]);

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;
    return products.filter(
      (product) => product.discountBucket === activeFilter,
    );
  }, [products, activeFilter]);

  const sectionTitle =
    activeFilter === "all" ? t("sale.flashSaleProducts") : t("sale.discountProducts", { pct: activeFilter });

  const handleFilterClick = (filter: DiscountFilter) => {
    if (activeFilter === filter) return;

    setActiveFilter(filter);
    router.replace(
      {
        pathname: router.pathname,
        query: { discount: String(filter) },
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      },
    );
  };

  return (
    <>
      <Head>
        <title>Flash Sale</title>
      </Head>

      <div className="min-h-screen desktop-page bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px] md:mt-6 md:max-w-7xl desktop-shell">
          {/* Mobile Header */}
          <header className="md:hidden overflow-hidden bg-gradient-to-b from-[#f42b67] to-[#e62a8d] pb-4 pt-2 text-white">
            <div className="flex items-center px-4">
              <button
                type="button"
                aria-label={t("common.back")}
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 text-white transition-all duration-300 hover:bg-white/30"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <div className="ml-3">
                <h1 className="text-[44px] font-extrabold leading-none">
                  Flash Sale
                </h1>
                <p className="mt-1 text-[16px] text-white/95">
                  {t("sale.specialDiscount")}
                </p>
              </div>
            </div>

          </header>

          {/* Desktop Header */}
          <header className="hidden md:block mb-6 overflow-hidden">
            <div className="relative rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-red-600 p-6 shadow-2xl">
              {/* Animated Background Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex items-center justify-between gap-6">
                {/* Left Side - Title */}
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
                      ⚡ Flash Sale
                    </h1>
                    <p className="text-white/90 text-base font-semibold mb-3">
                      {t("flash.discountUpTo")}
                    </p>
                  </div>
                </div>

                {/* Right Side - Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold text-base rounded-lg hover:bg-red-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t("common.back")}
                </button>
              </div>
            </div>
          </header>

          <main className="px-3 md:px-6 lg:px-8 pb-[102px] md:pb-8 pt-3 md:pt-0">
            {/* Filter Tabs */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 md:gap-3 rounded-2xl bg-white p-3 md:p-4 shadow-sm border border-gray-200">
                {filterTabs.map((tab) => {
                  const active = tab.key === activeFilter;
                  return (
                    <button
                      key={String(tab.key)}
                      type="button"
                      onClick={() => handleFilterClick(tab.key)}
                      className={`flex-1 md:flex-none min-w-[80px] md:min-w-[100px] rounded-lg px-4 py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-md ${
                        active
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tab.key === "all" ? t("sale.all") : `${tab.key}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Title */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1f2937]">
                {sectionTitle}
              </h2>
              <span className="text-sm md:text-base text-gray-600 font-semibold">
                {filteredProducts.length} {t("common.items")}
              </span>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 md:p-12 text-center">
                <div className="text-gray-400 mb-3">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-600">
                  {t("sale.noProducts")}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {t("sale.tryOtherDiscount")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    backgroundColor={
                      cardBackgrounds[idx % cardBackgrounds.length]
                    }
                    showBadge="sale"
                    salePercent={product.discountPercent}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        <MobileShopBottomNav activePath="/" />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SalePageProps> = async ({
  locale,
  query,
}) => {
  const lang = locale ?? "th";

  const raw = await prisma.product.findMany({
    where: { salePrice: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 48,
    include: {
      translations: { where: { locale: lang }, take: 1 },
    },
  });

  const products: SaleProduct[] = raw
    .filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price)
    .map((p) => {
      const discountPercent = Math.max(
        1,
        Math.round(((p.price - (p.salePrice as number)) / p.price) * 100),
      );

      return {
        ...mapToProduct(p, lang),
        discountPercent,
        discountBucket: getDiscountBucket(discountPercent),
      };
    });

  const initialFilter = parseDiscountFilter(query.discount) ?? 20;

  return {
    props: {
      products,
      initialFilter,
    },
  };
};
