import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

export default function TermsPage() {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("termsPage.pageTitle")} hideBottomNav>
      <div className="mx-auto w-full max-w-[440px] md:max-w-6xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <article className="rounded-[28px] border border-[#d9e0eb] bg-white px-5 py-8 md:px-10 desktop-shell">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {t("termsPage.heading")}
          </h1>
          <p className="mb-6 text-gray-700 leading-relaxed">
            {t("termsPage.intro")}
          </p>

          <div className="space-y-5 text-gray-800 leading-relaxed">
            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s1Heading")}
              </h2>
              <p>{t("termsPage.s1Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s2Heading")}
              </h2>
              <p>{t("termsPage.s2Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s3Heading")}
              </h2>
              <p>{t("termsPage.s3Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s4Heading")}
              </h2>
              <p>{t("termsPage.s4Text1")}</p>
              <p>{t("termsPage.s4Text2")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s5Heading")}
              </h2>
              <p>{t("termsPage.s5Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s6Heading")}
              </h2>
              <p>{t("termsPage.s6Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s7Heading")}
              </h2>
              <p>{t("termsPage.s7Text")}</p>
            </section>

            <section>
              <h2 className="mb-1 text-2xl font-semibold">
                {t("termsPage.s8Heading")}
              </h2>
              <p>{t("termsPage.s8Text")}</p>
            </section>
          </div>

          <p className="mt-8 text-sm text-gray-600">
            {t("termsPage.lastUpdated")}
          </p>
        </article>
      </div>
    </Layout>
  );
}
