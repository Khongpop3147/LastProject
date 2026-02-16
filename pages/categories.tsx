import type { GetServerSideProps } from "next";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { prisma } from "@/lib/prisma";
import { goBackOrPush } from "@/lib/navigation";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { ArrowLeft, ChevronRight, Heart, Settings } from "lucide-react";

type CategoryProduct = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  discountPercent: number;
};

type CategorySection = {
  id: string;
  name: string;
  productCount: number;
  coverImage: string | null;
  products: CategoryProduct[];
};

type CategoriesPageProps = {
  sections: CategorySection[];
};

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

export default function CategoriesPage({ sections }: CategoriesPageProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  return (
    <>
      <Head>
        <title>{t("categoriesPage.title")}</title>
      </Head>

      <div className="min-h-screen desktop-page bg-[#f3f3f4] text-[#111827] md:bg-transparent">
        {/* Mobile Header - Mobile Only */}
        <div className="md:hidden sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
          <div className="mx-auto w-full max-w-[440px]">
            <header className="flex h-[80px] items-center px-4">
              <button
                type="button"
                aria-label={t("categoriesPage.back")}
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#222b3a]"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <h1 className="ml-4 text-[28px] font-extrabold leading-none tracking-tight text-black">
                {t("categoriesPage.title")}
              </h1>

              <button
                type="button"
                aria-label={t("categoriesPage.settings")}
                onClick={() => router.push("/all-products?advanced=1")}
                className="ml-auto rounded-full p-1 text-[#4b5563]"
              >
                <Settings className="h-8 w-8" />
              </button>
            </header>
          </div>
        </div>

        {/* Desktop & Mobile Content */}
        <div className="mx-auto w-full max-w-[440px] px-4 md:max-w-7xl md:px-6 md:pt-6">
          {/* Desktop Header - Desktop Only */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h1 className="text-[28px] font-extrabold text-black">
              {t("categoriesPage.title")}
            </h1>
            <button
              type="button"
              aria-label={t("categoriesPage.settings")}
              onClick={() => router.push("/all-products?advanced=1")}
              className="rounded-full p-1 text-[#4b5563] hover:bg-gray-100"
            >
              <Settings className="h-8 w-8" />
            </button>
          </div>

          <main className="space-y-6 pb-[104px] md:pb-12 pt-3 md:pt-0">
            {sections.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-[#cccccc] bg-white p-6 text-center text-[#6b7280]">
                {t("categoriesPage.empty")}
              </section>
            ) : (
              sections.map((section) => (
                <section key={section.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={
                              section.coverImage ?? "/images/placeholder.png"
                            }
                            alt={section.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-[22px] font-extrabold leading-none text-[#1f2937]">
                            {section.name}
                          </h2>
                          <p className="mt-1 text-[14px] text-[#6b7280]">
                            {section.productCount.toLocaleString("th-TH")}{" "}
                            {t("categoriesPage.items")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/all-products?category=${section.id}`}
                      className="ml-3 flex flex-shrink-0 items-center gap-1 text-[16px] font-semibold text-[#2f6ef4]"
                    >
                      {t("categoriesPage.viewAll")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide md:grid md:gap-4 md:overflow-visible md:[grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                    {section.products.map((product) => {
                      const displayPrice = product.salePrice ?? product.price;
                      const hasDiscount =
                        typeof product.salePrice === "number" &&
                        product.salePrice < product.price;

                      return (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="w-[148px] flex-shrink-0 overflow-hidden rounded-[18px] border border-[#d8d8d8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.14)] md:w-auto"
                        >
                          <div className="relative h-[148px] md:h-[200px]">
                            <img
                              src={
                                product.imageUrl ?? "/images/placeholder.png"
                              }
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />

                            <span
                              className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                                hasDiscount
                                  ? "bg-gradient-to-r from-[#ff4f4f] to-[#ff2fab]"
                                  : "bg-[#2bb673]"
                              }`}
                            >
                              {hasDiscount
                                ? t("categoriesPage.discount", {
                                    percent: product.discountPercent,
                                  })
                                : t("categoriesPage.new")}
                            </span>

                            <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 p-1.5 shadow">
                              <Heart className="h-5 w-5 text-[#9ca3af]" />
                            </div>
                          </div>

                          <div className="px-2 py-2 md:px-3 md:py-3">
                            <h3 className="line-clamp-2 min-h-[38px] text-[14px] font-semibold leading-snug text-[#1f2937] md:min-h-[44px] md:text-[15px]">
                              {product.name}
                            </h3>

                            <div className="mt-1 flex items-end gap-1">
                              <span className="text-[24px] font-bold leading-none text-[#2f6ef4] md:text-[26px]">
                                {toCurrency(displayPrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-[12px] text-[#9ca3af] line-through">
                                  {toCurrency(product.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </main>
        </div>

        <div className="md:hidden">
          <MobileShopBottomNav activePath="/all-products" />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  CategoriesPageProps
> = async ({ locale }) => {
  const lang = locale ?? "th";
  const fallbackCategoryName = lang === "en" ? "Category" : "หมวดหมู่";
  const fallbackProductName = lang === "en" ? "Product" : "สินค้า";

  const rawCategories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      translations: { where: { locale: lang }, take: 1 },
      products: {
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          translations: { where: { locale: lang }, take: 1 },
        },
      },
    },
  });

  const sections: CategorySection[] = rawCategories
    .map((category) => {
      const name = category.translations[0]?.name ?? "";
      const products: CategoryProduct[] = category.products.map((product) => {
        const salePrice = product.salePrice ?? null;
        const discountPercent =
          salePrice && salePrice < product.price
            ? Math.max(
                1,
                Math.round(((product.price - salePrice) / product.price) * 100),
              )
            : 0;

        return {
          id: product.id,
          name: product.translations[0]?.name ?? fallbackProductName,
          price: product.price,
          salePrice,
          imageUrl: product.imageUrl,
          discountPercent,
        };
      });

      return {
        id: category.id,
        name: name || fallbackCategoryName,
        productCount: category._count.products,
        coverImage: products[0]?.imageUrl ?? null,
        products,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  return {
    props: {
      sections,
    },
  };
};
