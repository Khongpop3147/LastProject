// pages/promotions/[id].tsx
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";
import { prisma } from "@/lib/prisma";

interface Promotion {
  id: string;
  title: string;
  sub: string;
  description: string;
  imageUrl: string;
}

interface PromotionDetailProps {
  promotion: Promotion | null;
}

const PromotionDetailPage: NextPage<PromotionDetailProps> = ({ promotion }) => {
  const { t } = useTranslation("common");

  if (!promotion) {
    return (
      <Layout title={t("promoNotFound")}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">{t("promoNotFound")}</h1>
          <p>{t("promoNotFoundMsg")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{promotion.title}</title>
        <meta name="description" content={promotion.sub} />
      </Head>
      <Layout title={promotion.title}>
        {/* Hero Image */}
        <section
          className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-lg mb-8"
          style={{
            backgroundImage: `url('${promotion.imageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">
                {promotion.title}
              </h1>
              <p className="text-white mt-2 text-lg sm:text-xl">
                {promotion.sub}
              </p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold mb-4">{t("promoDetails")}</h2>
          {promotion.description ? (
            <p className="text-gray-700 leading-relaxed">
              {promotion.description}
            </p>
          ) : (
            <p className="text-gray-700">{t("noAdditionalInfo")}</p>
          )}
        </section>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<
  PromotionDetailProps
> = async ({ params, locale }) => {
  const id = params?.id as string;
  const lang = locale || "th";

  // ดึง translation จาก BannerLocale ตามภาษาที่เลือก
  const raw = await prisma.bannerLocale.findFirst({
    where: { bannerId: id, locale: lang },
    include: { banner: true },
  });

  if (!raw) {
    return { props: { promotion: null } };
  }

  const promotion: Promotion = {
    id,
    title: raw.title || "",
    sub: raw.sub || "",
    description: raw.description || "",
    imageUrl: raw.banner.imageUrl,
  };

  return {
    props: { promotion },
  };
};

export default PromotionDetailPage;
