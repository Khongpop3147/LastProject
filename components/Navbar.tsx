"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  CircleHelp,
  Globe,
  Heart,
  LogIn,
  LogOut,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
} from "lucide-react";
import useTranslation from "next-translate/useTranslation";

// ส่วนแถบบนสุด - ช่วยเหลือ, ติดตามคำสั่งซื้อ, การตั้งค่า
function TopBar() {
  const { t, lang } = useTranslation("common");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [seniorMode, setSeniorMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enabled = localStorage.getItem("seniorMode") === "true";
    setSeniorMode(enabled);
    document.documentElement.classList.toggle("senior-mode", enabled);
  }, []);

  const toggleSeniorMode = () => {
    const next = !seniorMode;
    setSeniorMode(next);
    localStorage.setItem("seniorMode", next ? "true" : "false");
    document.documentElement.classList.toggle("senior-mode", next);
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center justify-between px-4 md:px-6 lg:px-8">
        {/* ด้านซ้าย - ช่วยเหลือ & ติดตาม */}
        <div className="flex items-center gap-3 text-[18px] font-bold">
          <Link
            href="/qa"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition-all duration-300 hover:bg-gray-100 hover:text-blue-600 hover:scale-105"
          >
            <CircleHelp className="h-5 w-5" />
            {t("nav.help")}
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition-all duration-300 hover:bg-gray-100 hover:text-blue-600 hover:scale-105"
          >
            <Bell className="h-5 w-5" />
            {t("nav.trackOrders")}
          </Link>
        </div>

        {/* ด้านขวา - ขนาดตัวอักษร, ภาษา, ล็อกอิน */}
        <div className="flex items-center gap-3 text-[17px] font-bold">
          {/* ปุ่มขนาดตัวอักษร */}
          <button
            type="button"
            onClick={toggleSeniorMode}
            className={`inline-flex h-11 min-w-[64px] items-center justify-center rounded-lg px-4 text-[18px] font-extrabold transition-all duration-300 hover:scale-105 ${
              seniorMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white text-gray-800 hover:bg-gray-100 hover:shadow-md"
            }`}
            aria-label={t("nav.toggleFontSize")}
          >
            {seniorMode ? "A" : "A+"}
          </button>

          {/* สลับภาษา */}
          <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2">
            <Globe className="h-5 w-5" />
            <Link
              href={router.asPath}
              locale="th"
              className={
                lang === "th"
                  ? "font-extrabold text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }
            >
              TH
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={router.asPath}
              locale="en"
              className={
                lang === "en"
                  ? "font-extrabold text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }
            >
              EN
            </Link>
          </span>

          {/* แสดงผู้ใช้หรือปุ่มล็อกอิน */}
          {user ? (
            <>
              <span className="max-w-[240px] truncate rounded-lg bg-white px-4 py-2 font-bold text-gray-800">
                {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-50 px-4 font-bold text-red-700 transition-all duration-300 hover:bg-red-100 hover:scale-105 hover:shadow-md"
              >
                <LogOut className="h-5 w-5" />
                {t("logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg bg-blue-600 px-5 font-bold text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ส่วนโลโก้
function Logo() {
  return (
    <Link href="/" className="flex min-w-[200px] items-center gap-4 px-4 py-2">
      <div className="relative h-16 w-16">
        <Image
          src="/images/logo.png"
          alt="ICN_FREEZE"
          fill
          sizes="64px"
          className="object-contain"
        />
      </div>
      <span className="text-[48px] font-bold tracking-tight text-gray-900">
        ICN
      </span>
    </Link>
  );
}

// ช่องค้นหา
function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { t } = useTranslation("common");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      router.push("/all-products");
      return;
    }
    router.push(`/all-products?search=${encodeURIComponent(nextQuery)}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-1 items-center">
      <div className="flex h-14 w-full overflow-hidden rounded-lg border border-gray-300 bg-white">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder={t("nav.searchPlaceholder")}
          className="h-full flex-1 border-0 px-6 text-[22px] font-semibold text-gray-900 outline-none placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="flex h-full w-16 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700"
          aria-label={t("nav.search")}
        >
          <Search className="h-7 w-7" />
        </button>
      </div>
    </form>
  );
}

// เมนูหน้าแรก, สินค้า, เกี่ยวกับเรา, Q&A
function NavLinks() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = router.asPath.split("?")[0].split("#")[0] || "/";

  const navItems = [
    { key: "nav.home", href: "/" },
    { key: "nav.products", href: "/all-products" },
    { key: "nav.about", href: "/contact" },
    { key: "nav.qa", href: "/qa" },
  ];

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-5 py-3 text-[20px] font-bold transition-all duration-300 hover:scale-105 ${
              active
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:shadow-sm"
            }`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </div>
  );
}

// ปุ่มไอคอนด้านขวา - คำสั่งซื้อ, รายการโปรด, ตะกร้า, บัญชี
function ActionButtons() {
  const { t } = useTranslation("common");
  const { user } = useAuth();

  const iconBtnClass =
    "flex h-14 w-14 items-center justify-center rounded-lg text-gray-700 transition-all duration-300 hover:bg-gray-100 hover:scale-110 hover:shadow-md";

  return (
    <div className="ml-1 flex items-center gap-2">
      <Link href="/orders" className={iconBtnClass} aria-label="Orders">
        <Truck className="h-7 w-7" />
      </Link>
      <Link href="/wishlist" className={iconBtnClass} aria-label="Wishlist">
        <Heart className="h-7 w-7" />
      </Link>
      <Link href="/cart" className={iconBtnClass} aria-label="Cart">
        <ShoppingCart className="h-7 w-7" />
      </Link>

      {user ? (
        <Link
          href="/account/settings"
          className={`${iconBtnClass} hidden lg:flex`}
          aria-label={t("settings.title")}
        >
          <UserRound className="h-7 w-7" />
        </Link>
      ) : (
        <Link
          href="/login"
          className={`${iconBtnClass} hidden lg:flex`}
          aria-label={t("login")}
        >
          <LogIn className="h-7 w-7" />
        </Link>
      )}
    </div>
  );
}

// ส่วนหลัก
export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 hidden border-b border-gray-200 bg-white text-gray-900 md:block">
      {/* แถบบน */}
      <TopBar />

      {/* แถบหลัก */}
      <div className="mx-auto flex h-[100px] w-full max-w-[1360px] items-center gap-5 bg-white px-4 md:px-6 lg:px-8">
        <Logo />
        <SearchBar />
        <NavLinks />
        <ActionButtons />
      </div>
    </nav>
  );
}
