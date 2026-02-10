// components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Truck, ShoppingCart, Menu, X } from "lucide-react";
import useTranslation from "next-translate/useTranslation";

export default function Navbar() {
  const { t, lang } = useTranslation("common");
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: "nav.home", href: "/" },
    { key: "nav.products", href: "/all-products" },
    { key: "nav.about", href: "/contact" },
    { key: "nav.qa", href: "/qa" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
          {/* Left: Hamburger + Logo */}
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

          {/* Mobile: Orders & Cart Icons */}
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

          {/* Center (desktop): Nav Links + Language */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex items-center space-x-6">
              {navItems.map(({ key, href }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`px-3 py-1 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:text-green-600"
                      }`}
                    >
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Language Switcher */}
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Link
                href={pathname}
                locale="th"
                className={
                  lang === "th"
                    ? "bg-green-600 text-white px-2 py-1 rounded"
                    : "text-gray-700 hover:bg-gray-200 px-2 py-1 rounded"
                }
              >
                TH
              </Link>
              <Link
                href={pathname}
                locale="en"
                className={
                  lang === "en"
                    ? "bg-green-600 text-white px-2 py-1 rounded"
                    : "text-gray-700 hover:bg-gray-200 px-2 py-1 rounded"
                }
              >
                EN
              </Link>
            </div>
          </div>

          {/* Right (desktop): Icons & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/orders"
              className="text-gray-600 hover:text-green-600 transition"
            >
              <Truck size={24} />
            </Link>
            <Link
              href="/cart"
              className="text-gray-600 hover:text-green-600 transition"
            >
              <ShoppingCart size={24} />
            </Link>
            {user ? (
              <>
                <span className="text-gray-700">
                  {t("hello")}, {user.name}
                </span>
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
                  className="px-3 py-1 text-sm text-gray-700 rounded-md hover:text-green-600 transition"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  {t("signup")}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
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
                  href={pathname}
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
                  href={pathname}
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
                  <span className="text-gray-700">
                    {t("hello")}, {user.name}
                  </span>
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
