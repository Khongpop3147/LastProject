// pages/account.tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { User, Package, MapPin, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/router";

export default function AccountPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleLogout = () => {
    // ลบ session/token ที่เก็บไว้
    localStorage.removeItem("user");
    router.push("/login");
  };

  // เมนูบัญชี
  const menuItems = [
    {
      icon: <User className="w-6 h-6" />,
      label: "ข้อมูลส่วนตัว",
      href: "/account/profile",
    },
    {
      icon: <Package className="w-6 h-6" />,
      label: "คำสั่งซื้อของฉัน",
      href: "/orders",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      label: "ที่อยู่จัดส่ง",
      href: "/account/addresses",
    },
    {
      icon: <Settings className="w-6 h-6" />,
      label: "ตั้งค่า",
      href: "/account/settings",
    },
  ];

  return (
    <Layout title="บัญชีของฉัน">
      <div className="container mx-auto px-4 py-8 min-h-screen mb-20 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          บัญชีของฉัน
        </h1>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ผู้ใช้</h2>
              <p className="text-gray-500">user@example.com</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
            >
              <div className="text-gray-600">{item.icon}</div>
              <span className="flex-1 text-gray-900">{item.label}</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
