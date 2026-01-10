// pages/contact.tsx
import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

export default function ContactPage() {
  const { t } = useTranslation("common");

  return (
    <Layout title={t("contactUsTitle")}>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* หัวข้อ */}
        <h1 className="text-2xl font-semibold mb-2">{t("contactHeading")}</h1>
        <hr className="border-t-2 border-gray-400 mb-6" />

        {/* ข้อความ */}
        <p className="mb-6 leading-relaxed">{t("contactText")}</p>

        {/* ช่องทาง Line */}
        <p className="mb-2">
          <span className="font-medium">{t("lineLabel")}:</span>{" "}
          <span>{t("lineId")}</span>{" "}
          <span className="text-gray-600">{t("contactHours")}</span>
        </p>

        {/* ช่องทางโทรศัพท์ */}
        <p>
          <span className="font-medium">{t("phoneLabel")}:</span>{" "}
          <span>{t("phoneNumber")}</span>{" "}
          <span className="text-gray-600">{t("contactHours")}</span>
        </p>
      </div>
    </Layout>
  );
}
