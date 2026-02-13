import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { User, Package, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();

  return (
    <Layout title={t("accountLabel") || "Account"}>
      <div className="container mx-auto px-4 py-8 min-h-screen mb-20 md:mb-0 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          {t("accountLabel") || "Account"}
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.name || "User"}</h2>
              <p className="text-gray-500">{user?.email || "-"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-100">
          <Link href="/orders" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-gray-900">{t("orders")}</span>
          </Link>

          <Link href="/account/settings" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-gray-900">{t("settings.title")}</span>
          </Link>

          <Link href="/account/profile" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-t">
            <User className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-gray-900">{t("settings.profile")}</span>
          </Link>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t("logout")}</span>
        </button>
      </div>
    </Layout>
  );
}
