import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

export default function CookiePolicyPage() {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("cookiePolicy.pageTitle")} hideBottomNav>
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <article className="rounded-[28px] border border-[#d9e0eb] bg-white p-6 md:p-10 desktop-shell">
          <h1 className="mb-6 text-3xl font-bold md:text-4xl">
            {t("cookiePolicy.heading")}
          </h1>

          <p>{t("cookiePolicy.intro")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("cookiePolicy.typesHeading")}
          </h2>
          <ul className="list-disc pl-6">
            <li>
              <strong>{t("cookiePolicy.essentialLabel")}</strong>{" "}
              {t("cookiePolicy.essentialDesc")}
            </li>
            <li>
              <strong>{t("cookiePolicy.analyticsLabel")}</strong>{" "}
              {t("cookiePolicy.analyticsDesc")}
            </li>
            <li>
              <strong>{t("cookiePolicy.advertisingLabel")}</strong>{" "}
              {t("cookiePolicy.advertisingDesc")}
            </li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">
            {t("cookiePolicy.managementHeading")}
          </h2>
          <p>{t("cookiePolicy.managementDesc")}</p>

          <h2 className="mt-6 text-xl font-semibold">
            {t("cookiePolicy.impactHeading")}
          </h2>
          <p>{t("cookiePolicy.impactDesc")}</p>
        </article>
      </div>
    </Layout>
  );
}
