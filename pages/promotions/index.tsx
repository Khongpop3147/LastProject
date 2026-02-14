// pages/promotions/index.tsx
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import Head from "next/head";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma";

type Promo = {
  id: string;
  title: string;
  sub: string;
  description: string | null;
  imageUrl: string;
};

interface PromotionsPageProps {
  promotions: Promo[];
}

const PromotionsPage: NextPage<PromotionsPageProps> = ({ promotions }) => {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("allPromos")}>
      <Head>
        <meta name="description" content={t("allPromosDesc")} />
      </Head>

      <div className="mx-auto w-full max-w-[440px] md:max-w-7xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <section className="rounded-[28px] border border-[#d9e0eb] bg-white p-4 md:p-8 desktop-shell">
          <h1 className="mb-8 text-3xl font-semibold md:text-4xl">
            {t("allPromos")}
          </h1>

          {promotions.length === 0 ? (
            <p>{t("noPromosYet")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-56 w-full object-cover"
                  />
                  <div className="p-4">
                    <h2 className="mb-2 line-clamp-2 text-xl font-bold">
                      {p.title}
                    </h2>
                    <p className="mb-2 line-clamp-2 text-gray-600">{p.sub}</p>
                    {p.description ? (
                      <p className="mb-4 line-clamp-3 text-gray-700">
                        {p.description}
                      </p>
                    ) : null}
                    <Link
                      href={`/promotions/${p.id}`}
                      className="font-medium text-green-600 hover:underline"
                    >
                      {t("viewDetails")} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<
  PromotionsPageProps
> = async ({ locale }) => {
  const lang = locale || "th";
  // ดึงทุกรายการ BannerLocale ตามภาษา พร้อมความสัมพันธ์ไปยัง Banner
  const raws = await prisma.bannerLocale.findMany({
    where: { locale: lang },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });

  const promotions: Promo[] = raws.map((r) => ({
    id: r.bannerId,
    title: r.title ?? "",
    sub: r.sub ?? "",
    description: r.description || null,
    imageUrl: r.banner.imageUrl,
  }));

  return {
    props: { promotions },
  };
};

export default PromotionsPage;
