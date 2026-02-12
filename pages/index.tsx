// pages/index.tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import MobileHeader from "@/components/MobileHeader";
import Banner, { BannerSlide } from "@/components/Banner";
import CouponBanner from "@/components/CouponBanner";
import CategoryCarousel from "@/components/CategoryCarousel";
import DiscountCarousel from "@/components/DiscountCarousel";
import SubBanner from "@/components/SubBanner";
import SubBannerCarousel from "@/components/SubBannerCarousel";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { Category, Product } from "@/types/product";
import { Clock } from "lucide-react";

interface HomeProps {
  banners: BannerSlide[];
  subBanners: BannerSlide[];
  featured: Product[];
  onSale: Product[];
  bestSellers: Product[];
  categories: Category[];
  flashEndAt: string;
  serverNowTs: number;
  subBannerData: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    img: string;
  } | null;
}

export default function HomePage({
  banners,
  subBanners,
  featured,
  onSale,
  bestSellers,
  categories,
  flashEndAt,
  serverNowTs,
  subBannerData,
}: HomeProps) {
  const { t } = useTranslation("common");
  const [nowTs, setNowTs] = useState<number>(serverNowTs);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const endAtMs = useMemo(() => {
    const parsed = new Date(flashEndAt).getTime();
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [flashEndAt]);

  const remainingMs = Math.max(endAtMs - nowTs, 0);
  const hours = Math.min(Math.floor(remainingMs / 3_600_000), 99);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1_000);

  const format2 = (value: number) => String(Math.max(0, value)).padStart(2, "0");
  
  return (
    <Layout title={t("siteTitle")}>
      {/* Mobile Header - ร้านค้า + Search */}
      <div className="md:hidden -mt-8">
        <MobileHeader />
      </div>

      {/* Hero Banner */}
      <section className="px-4 mb-4">
        <Banner slides={banners} />
      </section>

      {/* Coupon Banner */}
      <section className="mb-5">
        <CouponBanner />
      </section>

      {/* Category Grid */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">หมวดหมู่สินค้า</h2>
          <a href="/categories" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
            ดูทั้งหมด →
          </a>
        </div>
        <CategoryCarousel categories={categories} />
      </section>

      {/* Sub Banner - แบนเนอร์โปรโมชั่น */}
      {subBanners && subBanners.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
          <SubBannerCarousel slides={subBanners} />
        </section>
      )}

      {/* Flash Sale */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Flash Sale</h2>
            <Clock className="w-4 h-4 text-red-500" />
            <div className="flex items-center gap-1 text-white text-xs font-bold">
              <span className="bg-black px-1.5 py-0.5 rounded">{format2(hours)}</span>
              <span className="bg-black px-1.5 py-0.5 rounded">{format2(minutes)}</span>
              <span className="bg-black px-1.5 py-0.5 rounded">{format2(seconds)}</span>
            </div>
          </div>
          <a href="/sale" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
            ดูทั้งหมด →
          </a>
        </div>
        
        {/* Flash Sale Products - Responsive Grid */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
          {onSale.slice(0, 10).map((product, idx) => {
            const bgColors = [
              "bg-gradient-to-br from-orange-400 to-orange-500",
              "bg-gradient-to-br from-yellow-400 to-yellow-500",
              "bg-gradient-to-br from-pink-400 to-pink-500",
              "bg-gradient-to-br from-blue-400 to-blue-500",
              "bg-gradient-to-br from-purple-400 to-purple-500"
            ];
            return (
              <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
                <ProductCard 
                  product={product} 
                  backgroundColor={bgColors[idx % bgColors.length]}
                  showBadge="sale"
                  salePercent={25 + (idx * 5)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Products - สินค้ายอดนิยม */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4">สินค้ายอดนิยม</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {bestSellers.slice(0, 5).map((product) => (
            <div key={product.id} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <img
                  src={product.imageUrl ?? "/images/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Products - สินค้าใหม่ */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">สินค้าใหม่</h2>
          <a href="/new" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
            ดูทั้งหมด →
          </a>
        </div>
        
        {/* New Products - Responsive Grid */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
          {featured.slice(0, 10).map((product, idx) => {
            const bgColors = [
              "bg-gradient-to-br from-cyan-400 to-cyan-500",
              "bg-gradient-to-br from-red-400 to-red-500",
              "bg-gradient-to-br from-blue-400 to-blue-500",
              "bg-gradient-to-br from-green-400 to-green-500",
              "bg-gradient-to-br from-indigo-400 to-indigo-500"
            ];
            return (
              <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
                <ProductCard 
                  product={product} 
                  backgroundColor={bgColors[idx % bgColors.length]}
                  showBadge="new"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommended Products - สินค้าแนะนำ */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">สินค้าแนะนำ</h2>
          <a href="/recommended" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
            ดูทั้งหมด →
          </a>
        </div>
        
        {/* Recommended Products - Responsive Grid */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
          {featured.slice(0, 10).map((product, idx) => {
            const bgColors = [
              "bg-gradient-to-br from-teal-400 to-teal-500",
              "bg-gradient-to-br from-amber-400 to-amber-500",
              "bg-gradient-to-br from-rose-400 to-rose-500",
              "bg-gradient-to-br from-violet-400 to-violet-500",
              "bg-gradient-to-br from-lime-400 to-lime-500"
            ];
            return (
              <div key={product.id} className="flex-shrink-0 w-40">
                <ProductCard 
                  product={product} 
                  backgroundColor={bgColors[idx % bgColors.length]}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Special Offers - ได้รับความนิยมสูง */}
      <section className="px-4 md:px-6 lg:px-8 mb-20 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">ได้รับความนิยมสูง</h2>
          <a href="/popular" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
            ดูทั้งหมด →
          </a>
        </div>
        
        {/* Popular Products - Responsive Grid */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
          {bestSellers.slice(0, 10).map((product, idx) => {
            const bgColors = [
              "bg-gradient-to-br from-fuchsia-400 to-fuchsia-500",
              "bg-gradient-to-br from-sky-400 to-sky-500",
              "bg-gradient-to-br from-emerald-400 to-emerald-500",
              "bg-gradient-to-br from-orange-400 to-orange-500",
              "bg-gradient-to-br from-pink-400 to-pink-500"
            ];
            return (
              <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
                <ProductCard 
                  product={product} 
                  backgroundColor={bgColors[idx % bgColors.length]}
                />
              </div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  // 1. Hero banners (กรองเฉพาะ banner หลัก ไม่รวม sub banner)
  const rawHero = await prisma.bannerLocale.findMany({
    where: { 
      locale: lang,
      banner: { 
        isNot: {
          position: "sub"
        }
      }
    },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });
  const banners: BannerSlide[] = rawHero.map(({ title, sub, banner }) => ({
    title: title ?? "",
    sub: sub ?? "",
    img: banner.imageUrl,
  }));

  // 2. Promotion banners
  const rawPromo = await prisma.bannerLocale.findMany({
    where: { locale: lang, banner: { position: "sub" } },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });
  const subBanners: BannerSlide[] = rawPromo.map(({ title, sub, banner }) => ({
    title: title ?? "",
    sub: sub ?? "",
    img: banner.imageUrl,
  }));

  // helper: fetch localized products
  async function getProducts(where: any, take?: number) {
    const raw = await prisma.product.findMany({
      where,
      take,
      orderBy: { updatedAt: "desc" },
      include: { translations: { where: { locale: lang }, take: 1 } },
    });
    return raw.map((p) => ({
      id: p.id,
      name: p.translations[0]?.name ?? "",
      description: p.translations[0]?.description ?? "",
      price: p.price,
      imageUrl: p.imageUrl,
      stock: p.stock,
      salePrice: p.salePrice ?? null,
      isFeatured: p.isFeatured,
    }));
  }

  // 3. Featured
  const featured = await getProducts({ isFeatured: true }, 6);

  // 4. On Sale
  const onSale = await getProducts({ salePrice: { not: null } }, 8);

  // 5. Best Sellers
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });
  const bestSellers: Product[] = await Promise.all(
    top.map(async ({ productId }) => {
      const p = await prisma.product.findUnique({
        where: { id: productId },
        include: { translations: { where: { locale: lang }, take: 1 } },
      });
      return {
        id: p!.id,
        name: p!.translations[0]?.name ?? "",
        description: p!.translations[0]?.description ?? "",
        price: p!.price,
        imageUrl: p!.imageUrl,
        stock: p!.stock,
        salePrice: p!.salePrice ?? null,
        isFeatured: p!.isFeatured,
      };
    })
  );

  // 6. Categories with product count
  const rawCats = await prisma.categoryLocale.findMany({
    where: { locale: lang },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  
  const categories: Category[] = await Promise.all(
    rawCats.map(async ({ category, name }) => {
      // นับจำนวนสินค้าในแต่ละหมวดหมู่
      const [productCount, coverProduct] = await Promise.all([
        prisma.product.count({
          where: { categoryId: category.id },
        }),
        prisma.product.findFirst({
          where: { categoryId: category.id, imageUrl: { not: null } },
          orderBy: { updatedAt: "desc" },
          select: { imageUrl: true },
        }),
      ]);
      
      return {
        id: category.id,
        name,
        productCount,
        imageUrl: coverProduct?.imageUrl ?? null,
      };
    })
  );

  // 7. Legacy SubBanner
  const rawSub = await prisma.subBannerLocale.findFirst({
    where: { locale: lang },
    include: { subBanner: true },
  });
  const subBannerData = rawSub
    ? {
        title: rawSub.title,
        description: rawSub.description,
        buttonText: rawSub.buttonText,
        buttonLink: rawSub.subBanner.buttonLink,
        img: rawSub.subBanner.imageUrl ?? "",
      }
    : null;

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
      banners,
      subBanners,
      featured,
      onSale,
      bestSellers,
      categories,
      flashEndAt: flashEndDate.toISOString(),
      serverNowTs: now.getTime(),
      subBannerData,
    },
  };
};
