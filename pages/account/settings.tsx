import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { ChevronRight, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

type SettingItem = {
  label: string;
  href?: string;
  value?: string;
};

function ItemRow({ item }: { item: SettingItem }) {
  const content = (
    <div className="flex items-center justify-between px-1 py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-800 text-base">{item.label}</span>
      <div className="flex items-center gap-2 text-gray-500">
        {item.value ? <span className="text-sm">{item.value}</span> : null}
        {item.href ? <ChevronRight className="w-4 h-4" /> : null}
      </div>
    </div>
  );

  if (!item.href) return content;
  return <Link href={item.href}>{content}</Link>;
}

export default function AccountSettingsPage() {
  const { t, lang } = useTranslation("common");
  const router = useRouter();
  const { user, logout, token } = useAuth();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null;

  const personalItems: SettingItem[] = [
    { label: t("settings.profile"), href: "/account/profile" },
    { label: t("settings.shippingAddress"), href: "/account/addresses" },
  ];

  const storeItems: SettingItem[] = [
    { label: t("settings.country"), value: lang === "th" ? "ไทย" : "Thailand" },
    { label: t("settings.currency"), value: "THB" },
    { label: t("settings.sizes"), value: "UK" },
    { label: t("settings.terms"), href: "/terms" },
  ];

  const accountItems: SettingItem[] = [
    { label: t("settings.language"), value: lang === "th" ? "ไทย" : "English" },
    { label: t("settings.about"), href: "/contact" },
  ];

  return (
    <Layout title={t("settings.title")}>
      <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("settings.title")}</h1>
        {user ? <p className="text-gray-500 mb-6">{user.email}</p> : null}

        <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("settings.personal")}</h2>
          <div>
            {personalItems.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("settings.store")}</h2>
          <div>
            {storeItems.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("settings.account")}</h2>
          <div>
            {accountItems.map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
          <button
            onClick={logout}
            className="mt-4 text-red-600 hover:text-red-700 inline-flex items-center gap-2"
            type="button"
          >
            <LogOut className="w-4 h-4" />
            {t("settings.logout")}
          </button>
        </section>
      </div>
    </Layout>
  );
}
