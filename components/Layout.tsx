// components/Layout.tsx
"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PromoModal from "./PromoModal";
import CookieConsent from "./CookieConsent";
import BottomNavigation from "./BottomNavigation";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({
  children,
  title = "ICN_FREEZE",
}: LayoutProps) {
  const [showPromo, setShowPromo] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seenPromo = localStorage.getItem("promoShown");
      if (!seenPromo) {
        setShowPromo(true);
        localStorage.setItem("promoShown", "true");
      }
      const cookieConsent = localStorage.getItem("cookieConsent");
      if (!cookieConsent) {
        setShowCookieConsent(true);
      }
    }
  }, []);

  const handleCookieConsent = (accepted: boolean) => {
    localStorage.setItem("cookieConsent", accepted ? "true" : "false");
    setShowCookieConsent(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content="ตลาดสินค้าเกษตรสดใหม่ ICN_FREEZE" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* fixed header - Hidden on mobile */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white shadow">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Language Switcher */}
          <nav className="flex space-x-2">
            <Link href="/" locale="th" className="hover:underline">
              ไทย
            </Link>
            <span>|</span>
            <Link href="/" locale="en" className="hover:underline">
              EN
            </Link>
          </nav>
          {/* Main Navbar */}
          <Navbar />
        </div>
      </header>

      {/* promo + cookie */}
      <PromoModal show={showPromo} onClose={() => setShowPromo(false)} />
      {showCookieConsent && (
        <CookieConsent
          onAccept={() => handleCookieConsent(true)}
          onDecline={() => handleCookieConsent(false)}
        />
      )}

      {/* content with top margin so it doesn't sit under the fixed header */}
      {/* Add bottom padding on mobile to prevent content from being hidden by bottom navigation */}
      <main className="flex-grow w-full mx-auto py-4 md:mt-20 pb-20 md:pb-0">
        {children}
      </main>

      <Footer />

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation cartCount={0} />
    </div>
  );
}
