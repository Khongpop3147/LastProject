// pages/index.tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import Banner, { BannerSlide } from "@/components/Banner";
import CategoryCarousel from "@/components/CategoryCarousel";
import DiscountCarousel from "@/components/DiscountCarousel";
import SubBanner from "@/components/SubBanner";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { Category, Product } from "@/types/product";

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
      {/* Hero Banner */}
      <section className="container py-2">
        <Banner slides={banners} />
      </section>

      {/* Category Carousel */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("categories")}</h2>
        <CategoryCarousel categories={categories} />
      </section>

      {/* On Sale */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("onSale")}</h2>
        <DiscountCarousel items={onSale} />
      </section>

      {/* Legacy SubBanner */}
      {subBannerData && (
        <section className="container py-6">
          <SubBanner {...subBannerData} />
        </section>
      )}

      {/* Special Offers */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("specialOffers")}</h2>
        <Banner slides={subBanners} isPromotion />
      </section>

      {/* Best Sellers */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("bestSellers")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-6">
        <h2 className="text-xl font-semibold mb-4">{t("featured")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  // 1. Hero banners
  const rawHero = await prisma.bannerLocale.findMany({
    where: { locale: lang },
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

  // 6. Categories
  const rawCats = await prisma.categoryLocale.findMany({
    where: { locale: lang },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  const categories: Category[] = rawCats.map(({ category, name }) => ({
    id: category.id,
    name,
  }));

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
