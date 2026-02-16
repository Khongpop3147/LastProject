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
        <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
          <div className="rounded-[28px] border border-[#d9e0eb] bg-white p-8 text-center desktop-shell">
            <h1 className="mb-4 text-2xl font-semibold">{t("promoNotFound")}</h1>
            <p>{t("promoNotFoundMsg")}</p>
          </div>
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
        <div className="mx-auto w-full max-w-[440px] md:max-w-7xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
          <article className="overflow-hidden rounded-[28px] border border-[#d9e0eb] bg-white desktop-shell">
            <section
              className="relative h-64 w-full overflow-hidden md:h-[460px]"
              style={{
                backgroundImage: `url('${promotion.imageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="px-4 text-center">
                  <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                    {promotion.title}
                  </h1>
                  <p className="mt-2 text-lg text-white sm:text-xl">
                    {promotion.sub}
                  </p>
                </div>
              </div>
            </section>

            <section className="px-5 py-6 md:px-10 md:py-8">
              <h2 className="mb-4 text-2xl font-semibold">{t("promoDetails")}</h2>
              {promotion.description ? (
                <p className="leading-relaxed text-gray-700">
                  {promotion.description}
                </p>
              ) : (
                <p className="text-gray-700">{t("noAdditionalInfo")}</p>
              )}
            </section>
          </article>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<
  PromotionDetailProps
> = async ({ params, locale }) => {
  const id = params?.id as string;
  const lang = locale || "th";

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
