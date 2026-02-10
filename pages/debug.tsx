// pages/debug.tsx
import useTranslation from "next-translate/useTranslation";

export default function DebugPage() {
  const { t, lang } = useTranslation("common");
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Debug i18n</h1>
      <p>
        Current locale: <strong>{lang}</strong>
      </p>
      <p>
        siteTitle: <strong>{t("siteTitle")}</strong>
      </p>
      <p>
        categories: <strong>{t("categories")}</strong>
      </p>
      <p>
        onSale: <strong>{t("onSale")}</strong>
      </p>
      <p>
        featured: <strong>{t("featured")}</strong>
      </p>
    </div>
  );
}
