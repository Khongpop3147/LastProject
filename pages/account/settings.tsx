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
    { label: t("settings.shippingAddress"), href: "/account/addresses/select" },
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
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 pb-[120px] md:pb-8 pt-4 md:pt-8">
        <div className="rounded-[28px] border border-[#d9e0eb] bg-white p-5 md:p-8 desktop-shell">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
          {t("settings.title")}
          </h1>
          {user ? <p className="mb-6 text-gray-500">{user.email}</p> : null}

          <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t("settings.personal")}
            </h2>
            <div>
              {personalItems.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
          </section>

          <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t("settings.store")}
            </h2>
            <div>
              {storeItems.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t("settings.account")}
            </h2>
            <div>
              {accountItems.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
            <button
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-700"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {t("settings.logout")}
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
