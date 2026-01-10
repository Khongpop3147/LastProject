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

      <section className="container mx-auto py-16">
        <h1 className="text-3xl font-semibold mb-8">{t("allPromos")}</h1>

        {promotions.length === 0 ? (
          <p>{t("noPromosYet")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotions.map((p) => (
              <div
                key={p.id}
                className="rounded-lg overflow-hidden shadow hover:shadow-lg transition"
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-2">{p.title}</h2>
                  <p className="text-gray-600 mb-2">{p.sub}</p>
                  {p.description && (
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {p.description}
                    </p>
                  )}
                  <Link
                    href={`/promotions/${p.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {t("viewDetails")} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
