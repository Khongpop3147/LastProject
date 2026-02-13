import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, Clock3 } from "lucide-react";
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
  flashEndAt: string;
  initialFilter: DiscountFilter;
};

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

function getDiscountBucket(discountPercent: number): DiscountFilter | 0 {
  if (discountPercent >= 50) return 50;
  if (discountPercent >= 40) return 40;
  if (discountPercent >= 30) return 30;
  if (discountPercent >= 20) return 20;
  if (discountPercent >= 10) return 10;
  return 0;
}

function format2(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

export default function SalePage({
  products,
  flashEndAt,
  initialFilter,
}: SalePageProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] =
    useState<DiscountFilter>(initialFilter);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  const endAtMs = useMemo(() => {
    const parsed = new Date(flashEndAt).getTime();
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [flashEndAt]);

  const remainingMs = Math.max(endAtMs - nowTs, 0);
  const hours = Math.min(Math.floor(remainingMs / 3_600_000), 99);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1_000);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;
    return products.filter(
      (product) => product.discountBucket === activeFilter,
    );
  }, [products, activeFilter]);

  const sectionTitle =
    activeFilter === "all" ? "สินค้า Flash Sale" : `สินค้าลด ${activeFilter}%`;

  const handleFilterClick = (filter: DiscountFilter) => {
    setActiveFilter(filter);
    const nextQuery: Record<string, string> = {};
    if (filter !== "all") {
      nextQuery.discount = String(filter);
    }
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
  };

  return (
    <>
      <Head>
        <title>Flash Sale</title>
      </Head>

      <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px] md:max-w-7xl">
          <header className="overflow-hidden bg-gradient-to-b from-[#f42b67] to-[#e62a8d] pb-4 md:pb-5 pt-2 md:pt-3 text-white">
            <div className="flex items-center px-4">
              <button
                type="button"
                aria-label="ย้อนกลับ"
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <div className="ml-3">
                <h1 className="text-[44px] font-extrabold leading-none">
                  Flash Sale
                </h1>
                <p className="mt-1 text-[16px] text-white/95">
                  ลดราคาพิเศษ จำนวนจำกัด!
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 px-4 text-[15px]">
              <div className="flex items-center gap-1">
                <Clock3 className="h-5 w-5" />
                สิ้นสุดใน
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-[#2f6ef4]">
                  {format2(hours)}
                </span>
                <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-[#2f6ef4]">
                  {format2(minutes)}
                </span>
                <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-[#2f6ef4]">
                  {format2(seconds)}
                </span>
              </div>
            </div>
          </header>

          <main className="px-3 pb-[102px] pt-3">
            <div className="mb-3 grid grid-cols-6 rounded-xl bg-[#d9d9db] p-1">
              {filterTabs.map((tab) => {
                const active = tab.key === activeFilter;
                return (
                  <button
                    key={String(tab.key)}
                    type="button"
                    onClick={() => handleFilterClick(tab.key)}
                    className={`rounded-lg py-1 text-[14px] font-semibold transition-colors ${
                      active ? "bg-[#93b7ff] text-[#1d4ed8]" : "text-[#111827]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <h2 className="mb-3 text-[40px] font-extrabold text-[#1f2937]">
              {sectionTitle}
            </h2>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cccccc] bg-white p-6 text-center text-[#6b7280]">
                ไม่พบสินค้าในช่วงส่วนลดนี้
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    backgroundColor={
                      cardBackgrounds[idx % cardBackgrounds.length]
                    }
                    showBadge="sale"
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
        ...mapToProduct(p),
        discountPercent,
        discountBucket: getDiscountBucket(discountPercent),
      };
    });

  const discountQuery =
    typeof query.discount === "string" ? query.discount : "";
  const numeric = Number(discountQuery);
  const initialFilter: DiscountFilter =
    discountQuery === "all"
      ? "all"
      : [10, 20, 30, 40, 50].includes(numeric)
        ? (numeric as DiscountFilter)
        : 20;

  const now = new Date();
  const configuredEnd = process.env.FLASH_SALE_END_AT;
  let flashEndDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  if (configuredEnd) {
    const parsed = new Date(configuredEnd);
    if (!Number.isNaN(parsed.getTime())) {
      flashEndDate = parsed;
    }
  }

  return {
    props: {
      products,
      flashEndAt: flashEndDate.toISOString(),
      initialFilter,
    },
  };
};
