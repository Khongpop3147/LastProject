// components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Truck, ShoppingCart, Heart, Menu, X } from "lucide-react";
import useTranslation from "next-translate/useTranslation";

export default function Navbar() {
  const { t, lang } = useTranslation("common");
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = router.asPath.split("?")[0].split("#")[0] || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: "nav.home", href: "/" },
    { key: "nav.products", href: "/all-products" },
    { key: "nav.about", href: "/contact" },
    { key: "nav.qa", href: "/qa" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex-shrink-0 ml-2 md:ml-0">
              <div className="relative w-24 sm:w-32 md:w-40 h-10 sm:h-12 md:h-14">
                <Image
                  src="/images/logo.png"
                  alt="ICN_FREEZE Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4 md:hidden">
            <Link href="/orders" aria-label={t("orders")}>
              <Truck
                size={24}
                className="text-gray-600 hover:text-green-600 transition"
              />
            </Link>
            <Link href="/cart" aria-label={t("cart")}>
              <ShoppingCart
                size={24}
                className="text-gray-600 hover:text-green-600 transition"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            <ul className="flex items-center space-x-7">
              {navItems.map(({ key, href }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`px-4 py-2 text-lg font-semibold rounded-full transition-colors ${
                        isActive
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center space-x-2 text-sm font-medium">
              <Link
                href={router.asPath}
                locale="th"
                className={
                  lang === "th"
                    ? "bg-teal-600 text-white px-2 py-1 rounded"
                    : "text-gray-700 hover:bg-gray-200 px-2 py-1 rounded"
                }
              >
                TH
              </Link>
              <Link
                href={router.asPath}
                locale="en"
                className={
                  lang === "en"
                    ? "bg-teal-600 text-white px-2 py-1 rounded"
                    : "text-gray-700 hover:bg-gray-200 px-2 py-1 rounded"
                }
              >
                EN
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/orders"
              className="text-gray-600 hover:text-teal-700 transition"
            >
              <Truck size={24} />
            </Link>
            <Link
              href="/wishlist"
              className="text-gray-600 hover:text-teal-700 transition"
            >
              <Heart size={24} />
            </Link>
            <Link
              href="/cart"
              className="text-gray-600 hover:text-teal-700 transition"
            >
              <ShoppingCart size={24} />
            </Link>
            {user ? (
              <>
                <Link
                  href="/account/settings"
                  className="px-3 py-1 text-sm text-gray-700 rounded-md hover:text-teal-700 transition"
                >
                  {t("settings.title")}
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1 text-sm text-gray-700 rounded-md hover:text-teal-700 transition"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                >
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t shadow-sm">
            <ul className="flex flex-col divide-y">
              {navItems.map(({ key, href }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-4 py-3 text-gray-700 hover:bg-green-50 transition-colors ${
                        isActive ? "bg-green-600 text-white" : ""
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col space-y-2 p-4 border-t">
              <div className="flex items-center space-x-2">
                <Link
                  href={router.asPath}
                  locale="th"
                  className={`px-2 py-1 rounded transition-colors ${
                    lang === "th"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  TH
                </Link>
                <Link
                  href={router.asPath}
                  locale="en"
                  className={`px-2 py-1 rounded transition-colors ${
                    lang === "en"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  EN
                </Link>
              </div>
              {user ? (
                <>
                  <Link
                    href="/account/settings"
                    className="block text-gray-700 hover:bg-green-50 px-4 py-2 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("settings.title")}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="text-red-500 hover:underline text-left"
                  >
                    {t("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:bg-green-50 px-4 py-2 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="block text-green-600 hover:bg-green-50 px-4 py-2 rounded transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("signup")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
