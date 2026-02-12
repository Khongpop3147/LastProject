import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { prisma } from "@/lib/prisma";
import type { Category, Product } from "@/types/product";

type SortKey = "popular" | "newest" | "priceLowToHigh" | "priceHighToLow";

type SearchProduct = Product & {
  createdAt: string;
  popularityScore: number;
};

type AllProductsProps = {
  products: SearchProduct[];
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
  initialSort: SortKey;
  initialMaxPrice: number | null;
  initialDiscountOnly: boolean;
  initialShowAdvanced: boolean;
};

const HISTORY_STORAGE_KEY = "search_history_v1";
const MAX_HISTORY_ITEMS = 8;
const cardBackgrounds = [
  "bg-gradient-to-br from-orange-400 to-orange-500",
  "bg-gradient-to-br from-pink-300 to-rose-300",
  "bg-gradient-to-br from-cyan-400 to-sky-500",
  "bg-gradient-to-br from-red-400 to-orange-500",
  "bg-gradient-to-br from-amber-300 to-orange-300",
  "bg-gradient-to-br from-fuchsia-300 to-pink-300",
  "bg-gradient-to-br from-gray-200 to-gray-300",
  "bg-gradient-to-br from-slate-200 to-slate-300",
];

function getDisplayPrice(product: SearchProduct) {
  if (typeof product.salePrice === "number" && product.salePrice < product.price) {
    return product.salePrice;
  }

  return product.price;
}

function getDiscountPercent(product: SearchProduct) {
  if (typeof product.salePrice !== "number" || product.salePrice >= product.price) {
    return 0;
  }

  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function computePriceCeiling(products: SearchProduct[]) {
  const highest = products.reduce((max, item) => Math.max(max, getDisplayPrice(item)), 0);
  const rounded = Math.ceil(highest / 1000) * 1000;
  return Math.max(30000, rounded || 30000);
}

function parseSort(value: unknown): SortKey {
  if (
    value === "popular" ||
    value === "newest" ||
    value === "priceLowToHigh" ||
    value === "priceHighToLow"
  ) {
    return value;
  }

  return "popular";
}

export default function AllProductsPage({
  products,
  categories,
  initialQuery,
  initialCategory,
  initialSort,
  initialMaxPrice,
  initialDiscountOnly,
  initialShowAdvanced,
}: AllProductsProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortKey>(initialSort);
  const [discountOnly, setDiscountOnly] = useState(initialDiscountOnly);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const priceCeiling = useMemo(() => computePriceCeiling(products), [products]);
  const [maxPrice, setMaxPrice] = useState(() => {
    const defaultMax = computePriceCeiling(products);
    if (typeof initialMaxPrice === "number" && initialMaxPrice > 0) {
      return Math.min(initialMaxPrice, defaultMax);
    }
    return defaultMax;
  });

  useEffect(() => {
    setMaxPrice((prev) => Math.min(Math.max(prev, 0), priceCeiling));
  }, [priceCeiling]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      const sanitized = parsed
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_HISTORY_ITEMS);

      setSearchHistory(sanitized);
    } catch (error) {
      console.error("Cannot parse search history", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(searchHistory.slice(0, MAX_HISTORY_ITEMS))
    );
  }, [searchHistory]);

  const suggestedKeywords = useMemo(() => {
    const base = ["กระโปรง", "เครื่องประดับ", "เสื้อยืดสีดำ", "ยีนส์", "รองเท้าสีขาว"];
    const fromCategories = categories.slice(0, 2).map((item) => item.name);
    return Array.from(new Set([...base, ...fromCategories])).slice(0, 6);
  }, [categories]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const name = product.name.toLowerCase();
      const desc = (product.description ?? "").toLowerCase();
      const hitKeyword =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        desc.includes(normalizedSearch);

      const hitCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;

      const hitPrice = getDisplayPrice(product) <= maxPrice;
      const hitDiscount = !discountOnly || getDiscountPercent(product) > 0;

      return hitKeyword && hitCategory && hitPrice && hitDiscount;
    });

    list.sort((a, b) => {
      if (sortBy === "priceLowToHigh") {
        return getDisplayPrice(a) - getDisplayPrice(b);
      }

      if (sortBy === "priceHighToLow") {
        return getDisplayPrice(b) - getDisplayPrice(a);
      }

      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      const scoreGap = b.popularityScore - a.popularityScore;
      if (scoreGap !== 0) return scoreGap;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [products, normalizedSearch, selectedCategory, maxPrice, discountOnly, sortBy]);

  const commitSearch = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;

    setSearchHistory((prev) => {
      const next = [value, ...prev.filter((item) => item.toLowerCase() !== value.toLowerCase())];
      return next.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const applyKeyword = (keyword: string) => {
    setSearchTerm(keyword);
    commitSearch(keyword);
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("popular");
    setDiscountOnly(false);
    setMaxPrice(priceCeiling);
  };

  const emptyResult = filteredProducts.length === 0;
  const showNoResult =
    emptyResult &&
    (normalizedSearch.length > 0 || selectedCategory !== "all" || discountOnly || maxPrice < priceCeiling);
  const showHelperSections = showAdvanced || normalizedSearch.length === 0;

  return (
    <>
      <Head>
        <title>ค้นหาสินค้า</title>
      </Head>

      <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
            <div className="flex items-center gap-2 px-2.5 py-2.5">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]"
                  strokeWidth={2.25}
                />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="ค้นหา สินค้า"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      commitSearch(searchTerm);
                    }
                  }}
                  className="h-12 w-full rounded-[16px] border border-[#c3ccda] bg-[#dde5f2] pl-10 pr-10 text-[18px] text-[#1f2937] outline-none placeholder:text-[#a6b0c2] focus:border-[#6b92d9]"
                />
                {searchTerm.trim().length > 0 ? (
                  <button
                    type="button"
                    aria-label="ล้างคำค้นหา"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f0f2f7] text-[#7b8495]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                aria-label="ตัวกรองขั้นสูง"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  showAdvanced
                    ? "bg-[#2f6ef4] text-white"
                    : "border border-[#c3ccda] bg-[#f0f2f6] text-[#6b7280]"
                }`}
              >
                <SlidersHorizontal className="h-7 w-7" strokeWidth={2.25} />
              </button>
            </div>
          </header>

          <main className="px-3 pb-[102px] pt-3">
            {showAdvanced ? (
              <section className="space-y-4 pb-4">
                <div>
                  <h2 className="mb-2 text-[20px] font-extrabold text-[#1f2937]">หมวดหมู่</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        selectedCategory === "all"
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                          selectedCategory === category.id
                            ? "bg-[#2f6ef4] text-white"
                            : "bg-[#dce3f2] text-[#2f2f2f]"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-[20px] font-extrabold text-[#1f2937]">เรียงตาม</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSortBy("popular")}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        sortBy === "popular"
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      ยอดนิยม
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("newest")}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        sortBy === "newest"
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      ใหม่ล่าสุด
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("priceLowToHigh")}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        sortBy === "priceLowToHigh"
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      ราคาต่ำไป-สูง
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("priceHighToLow")}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        sortBy === "priceHighToLow"
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      ราคาสูงไป-ต่ำ
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountOnly((prev) => !prev)}
                      className={`rounded-xl px-4 py-2 text-[18px] font-semibold ${
                        discountOnly
                          ? "bg-[#2f6ef4] text-white"
                          : "bg-[#dce3f2] text-[#2f2f2f]"
                      }`}
                    >
                      เฉพาะลดราคา
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-[20px] font-extrabold text-[#1f2937]">
                    ช่วงราคา: ฿0 - {toCurrency(maxPrice)}
                  </h2>
                  <input
                    type="range"
                    min={0}
                    max={priceCeiling}
                    step={500}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#d1d5db] accent-[#2f6ef4]"
                  />
                </div>
              </section>
            ) : null}

            {showNoResult ? (
              <section className="flex min-h-[560px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#dedede]">
                  <ShoppingCart className="h-[56px] w-[56px] text-[#8f8f8f]" strokeWidth={1.8} />
                </div>
                <h2 className="text-[32px] font-extrabold leading-tight text-black">ไม่พบสินค้า</h2>
                <p className="mt-1 text-[18px] text-[#6b7280]">
                  ลองค้นหาด้วยคำอื่น หรือดูหมวดหมู่สินค้า
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 rounded-2xl border border-[#2f6ef4] px-8 py-2.5 text-[18px] font-medium text-[#2f6ef4]"
                >
                  ไปดูสินค้า
                </button>
              </section>
            ) : (
              <>
                {showHelperSections ? (
                  <>
                    <section className="pb-2">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-[20px] font-extrabold text-[#1f2937]">ประวัติการค้นหา</h2>
                        {searchHistory.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSearchHistory([])}
                            className="flex items-center gap-1 text-[17px] text-[#ef6b6b]"
                          >
                            <Trash2 className="h-4 w-4" />
                            ลบทิ้งหมด
                          </button>
                        ) : null}
                      </div>

                      {searchHistory.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {searchHistory.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => applyKeyword(item)}
                              className="rounded-xl bg-[#dce3f2] px-4 py-2 text-[18px] text-[#2f2f2f]"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[16px] text-[#9ca3af]">ยังไม่มีประวัติการค้นหา</p>
                      )}
                    </section>

                    <section className="pb-2 pt-3">
                      <h2 className="mb-2 text-[20px] font-extrabold text-[#1f2937]">แนะนำ</h2>
                      <div className="flex flex-wrap gap-2">
                        {suggestedKeywords.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => applyKeyword(item)}
                            className="rounded-xl bg-[#dce3f2] px-4 py-2 text-[18px] text-[#2f2f2f]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}

                <section className="pt-2">
                  <div className="mb-2 flex items-end justify-between">
                    <h2 className="text-[24px] font-extrabold text-[#1f2937]">สำรวจสินค้า</h2>
                    <p className="text-[15px] text-[#6b7280]">
                      ทั้งหมด {filteredProducts.length} รายการ
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-2 rounded-2xl border border-dashed border-[#cfd3db] bg-white p-5 text-center text-[16px] text-[#6b7280]">
                        ยังไม่มีสินค้าให้แสดง
                      </div>
                    ) : (
                      filteredProducts.map((product, idx) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          backgroundColor={cardBackgrounds[idx % cardBackgrounds.length]}
                          showBadge={getDiscountPercent(product) > 0 ? "sale" : "new"}
                          salePercent={Math.max(getDiscountPercent(product), 20)}
                        />
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>

        <MobileShopBottomNav activePath="/all-products" />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<AllProductsProps> = async ({
  locale,
  query,
}) => {
  const lang = locale ?? "th";
  const initialQuery = typeof query.q === "string" ? query.q : "";
  const initialCategory =
    typeof query.category === "string" && query.category.length > 0
      ? query.category
      : "all";
  const initialSort = parseSort(query.sort);
  const initialMaxPrice =
    typeof query.maxPrice === "string" && Number(query.maxPrice) > 0
      ? Number(query.maxPrice)
      : null;
  const initialDiscountOnly = query.discount === "1";
  const initialShowAdvanced = query.advanced === "1";

  const [rawCategories, rawProducts, soldSummary] = await Promise.all([
    prisma.category.findMany({
      include: {
        translations: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      include: {
        translations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
    }),
  ]);

  const soldByProduct = new Map<string, number>();
  for (const item of soldSummary) {
    soldByProduct.set(item.productId, item._sum.quantity ?? 0);
  }

  const categories: Category[] = rawCategories
    .map((category) => {
      const localized =
        category.translations.find((item) => item.locale === lang)?.name ||
        category.translations[0]?.name ||
        "หมวดหมู่";

      return {
        id: category.id,
        name: localized,
        productCount: category._count.products,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const products: SearchProduct[] = rawProducts.map((product) => {
    const localized =
      product.translations.find((item) => item.locale === lang) ||
      product.translations[0];

    return {
      id: product.id,
      name: localized?.name ?? "สินค้า",
      description: localized?.description ?? "",
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      salePrice: product.salePrice,
      categoryId: product.categoryId ?? undefined,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt.toISOString(),
      popularityScore: soldByProduct.get(product.id) ?? 0,
    };
  });

  return {
    props: {
      products,
      categories,
      initialQuery,
      initialCategory,
      initialSort,
      initialMaxPrice,
      initialDiscountOnly,
      initialShowAdvanced,
    },
  };
};
