import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("privacyPolicy.pageTitle")} hideBottomNav>
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <article className="rounded-[28px] border border-[#d9e0eb] bg-white p-6 md:p-10 desktop-shell">
          <h1 className="mb-6 text-3xl font-bold md:text-4xl">
            {t("privacyPolicy.heading")}
          </h1>

          <p>{t("privacyPolicy.intro")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.collectionHeading")}
          </h2>
          <p>{t("privacyPolicy.collectionDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.usageHeading")}
          </h2>
          <p>{t("privacyPolicy.usageDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.storageHeading")}
          </h2>
          <p>{t("privacyPolicy.storageDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.disclosureHeading")}
          </h2>
          <p>{t("privacyPolicy.disclosureDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.rightsHeading")}
          </h2>
          <p>{t("privacyPolicy.rightsDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("privacyPolicy.legalHeading")}
          </h2>
          <p>{t("privacyPolicy.legalDesc")}</p>
        </article>
      </div>
    </Layout>
  );
}
