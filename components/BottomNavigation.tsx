// components/BottomNavigation.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { ShoppingCart } from "lucide-react";
import useTranslation from "next-translate/useTranslation";

interface BottomNavigationProps {
  cartCount?: number;
}

export default function BottomNavigation({ cartCount = 0 }: BottomNavigationProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const currentPath = router.pathname;

  const navItems = [
    {
      href: "/",
      label: t("home") || "หน้าหลัก",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/wishlist",
      label: t("wishlist") || "ถูกใจ",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      href: "/search",
      label: t("search") || "ค้นหา",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: "/cart",
      label: t("cart") || "ตะกร้า",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: cartCount,
    },
    {
      href: "/account",
      label: t("account") || "บัญชี",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white md:hidden shadow-lg"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? "font-bold" : ""}`}>
                {item.label}
              </span>
              {isActive && (
  <div className="absolute inset-x-1 top-1 bottom-1 bg-blue-100 rounded-xl -z-10 animate-fade-in" />// แถบแสดงสถานะ (Active Indicator)
)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
