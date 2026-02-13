import { GetServerSideProps } from "next";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import MobileHeader from "@/components/MobileHeader";
import Banner, { BannerSlide } from "@/components/Banner";
import CouponBanner from "@/components/CouponBanner";
import CategoryCarousel from "@/components/CategoryCarousel";
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
  subBannerData: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    img: string;
  } | null;
}

type ShelfProps = {
  title: string;
  href: string;
  products: Product[];
  viewAllLabel: string;
  showBadge?: "sale" | "new";
  palette: string[];
  icon?: React.ReactNode;
};

function ProductShelf({ title, href, products, viewAllLabel, showBadge, palette, icon }: ShelfProps) {
  return (
    <section className="mb-8 md:mb-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          {icon}
        </div>
        <Link href={href} className="text-sm text-teal-700 hover:underline font-medium">
          {viewAllLabel}
        </Link>
      </div>

      <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
        {products.slice(0, 10).map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
            <ProductCard
              product={product}
              backgroundColor={palette[idx % palette.length]}
              showBadge={showBadge ?? null}
              salePercent={25 + idx * 5}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage({
  banners,
  subBanners,
  featured,
  onSale,
  bestSellers,
  categories,
}: HomeProps) {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("siteTitle")}>
      <div className="md:hidden -mt-8">
        <MobileHeader />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-8 -right-6 w-48 h-48 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="pointer-events-none absolute top-64 -left-10 w-56 h-56 rounded-full bg-cyan-100/50 blur-3xl" />

        <section className="pt-1 md:pt-2 mb-5 md:mb-6">
          <Banner slides={banners} />
        </section>

        <section className="mb-6">
          <CouponBanner />
        </section>

        <section className="mb-8 md:mb-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t("categories") || "Categories"}</h2>
            <Link href="/all-products" className="text-sm text-teal-700 hover:underline font-medium">
              {t("viewAll") || "View all"}
            </Link>
          </div>
          <CategoryCarousel categories={categories} />
        </section>

        {subBanners && subBanners.length > 0 && (
          <section className="mb-8 md:mb-10">
            <SubBannerCarousel slides={subBanners} />
          </section>
        )}

        <ProductShelf
          title={t("flashSale") || "Flash Sale"}
          href="/all-products?discount=1"
          products={onSale}
          viewAllLabel={t("viewAll") || "View all"}
          showBadge="sale"
          icon={<Clock className="w-4 h-4 text-red-500" />}
          palette={[
            "bg-gradient-to-br from-orange-400 to-orange-500",
            "bg-gradient-to-br from-yellow-400 to-yellow-500",
            "bg-gradient-to-br from-pink-400 to-pink-500",
            "bg-gradient-to-br from-blue-400 to-blue-500",
            "bg-gradient-to-br from-purple-400 to-purple-500",
          ]}
        />

        <section className="mb-8 md:mb-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 md:p-5 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            {t("popularPicks") || "Popular Picks"}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
            {bestSellers.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-xl border border-gray-100 bg-white p-2 text-center hover:shadow-md transition"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
                  <img
                    src={product.imageUrl ?? "/images/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-sm md:text-base line-clamp-2 text-gray-800">{product.name}</p>
              </Link>
            ))}
          </div>
        </section>

        <ProductShelf
          title={t("newArrivals") || "New Arrivals"}
          href="/all-products"
          products={featured}
          viewAllLabel={t("viewAll") || "View all"}
          showBadge="new"
          palette={[
            "bg-gradient-to-br from-cyan-400 to-cyan-500",
            "bg-gradient-to-br from-red-400 to-red-500",
            "bg-gradient-to-br from-blue-400 to-blue-500",
            "bg-gradient-to-br from-green-400 to-green-500",
            "bg-gradient-to-br from-indigo-400 to-indigo-500",
          ]}
        />

        <ProductShelf
          title={t("recommended") || "Recommended"}
          href="/all-products"
          products={featured}
          viewAllLabel={t("viewAll") || "View all"}
          palette={[
            "bg-gradient-to-br from-teal-400 to-teal-500",
            "bg-gradient-to-br from-amber-400 to-amber-500",
            "bg-gradient-to-br from-rose-400 to-rose-500",
            "bg-gradient-to-br from-violet-400 to-violet-500",
            "bg-gradient-to-br from-lime-400 to-lime-500",
          ]}
        />

        <ProductShelf
          title={t("bestSellers") || "Best Sellers"}
          href="/all-products"
          products={bestSellers}
          viewAllLabel={t("viewAll") || "View all"}
          palette={[
            "bg-gradient-to-br from-fuchsia-400 to-fuchsia-500",
            "bg-gradient-to-br from-sky-400 to-sky-500",
            "bg-gradient-to-br from-emerald-400 to-emerald-500",
            "bg-gradient-to-br from-orange-400 to-orange-500",
            "bg-gradient-to-br from-pink-400 to-pink-500",
          ]}
        />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  const rawHero = await prisma.bannerLocale.findMany({
    where: {
      locale: lang,
      banner: {
        isNot: {
          position: "sub",
        },
      },
    },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });

  const banners: BannerSlide[] = rawHero.map(({ title, sub, banner }) => ({
    title: title ?? "",
    sub: sub ?? "",
    img: banner.imageUrl,
  }));

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

  const featured = await getProducts({ isFeatured: true }, 10);
  const onSale = await getProducts({ salePrice: { not: null } }, 10);

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

      if (!p) {
        return {
          id: productId,
          name: "",
          description: "",
          price: 0,
          imageUrl: null,
          stock: 0,
          salePrice: null,
          isFeatured: false,
        };
      }

      return {
        id: p.id,
        name: p.translations[0]?.name ?? "",
        description: p.translations[0]?.description ?? "",
        price: p.price,
        imageUrl: p.imageUrl,
        stock: p.stock,
        salePrice: p.salePrice ?? null,
        isFeatured: p.isFeatured,
      };
    })
  );

  const rawCats = await prisma.categoryLocale.findMany({
    where: { locale: lang },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const categories: Category[] = await Promise.all(
    rawCats.map(async ({ category, name }) => {
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
