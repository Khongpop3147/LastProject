// pages/index.tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
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

interface HomeProps {
  banners: BannerSlide[];       // Hero banners
  subBanners: BannerSlide[];    // Sub/Promotion banners
  featured: Product[];          // สินค้าแนะนำ
  onSale: Product[];            // สินค้าลดราคา
  bestSellers: Product[];       // สินค้าขายดี
  categories: Category[];
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
  subBannerData,
}: HomeProps) {
  const { t } = useTranslation("common");
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
          <a href="/categories" className="text-sm text-blue-600 hover:underline">
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

      {/* Special Offers */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("specialOffers")}</h2>
        <Banner slides={subBanners} isPromotion />
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

      {/* Coupons */}
    <section className="container py-10">
      <h2 className="text-xl font-semibold mb-4">
        {t("coupons")}
      </h2>
      <CouponsCarousel />
    </section>

      {/* New Products - สินค้าใหม่ */}
      <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">สินค้าใหม่</h2>
          <a href="/new" className="text-sm text-blue-600 hover:underline">
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
          <a href="/recommended" className="text-sm text-blue-600 hover:underline">
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
          <a href="/popular" className="text-sm text-blue-600 hover:underline">
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
      const productCount = await prisma.product.count({
        where: { categoryId: category.id },
      });
      
      return {
        id: category.id,
        name,
        productCount,
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

  return {
    props: {
      banners,
      subBanners,
      featured,
      onSale,
      bestSellers,
      categories,
      subBannerData,
    },
  };
};
