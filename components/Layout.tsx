// components/Layout.tsx
"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import useTranslation from "next-translate/useTranslation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PromoModal from "./PromoModal";
import CookieConsent from "./CookieConsent";
import BottomNavigation from "./BottomNavigation";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  hideBottomNav?: boolean;
}

export default function Layout({
  children,
  title = "ICN_FREEZE",
  hideBottomNav = false,
}: LayoutProps) {
  const { t } = useTranslation("common");
  const [showPromo, setShowPromo] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [seniorMode, setSeniorMode] = useState(false);

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
      const seniorPref = localStorage.getItem("seniorMode");
      const enabled = seniorPref === "true";
      setSeniorMode(enabled);
      document.documentElement.classList.toggle("senior-mode", enabled);
    }
  }, []);

  const toggleSeniorMode = () => {
    const next = !seniorMode;
    setSeniorMode(next);
    localStorage.setItem("seniorMode", next ? "true" : "false");
    document.documentElement.classList.toggle("senior-mode", next);
  };

  const handleCookieConsent = (accepted: boolean) => {
    localStorage.setItem("cookieConsent", accepted ? "true" : "false");
    setShowCookieConsent(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Fresh marketplace by ICN_FREEZE" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <Navbar />

      <PromoModal show={showPromo} onClose={() => setShowPromo(false)} />
      {showCookieConsent && (
        <CookieConsent
          onAccept={() => handleCookieConsent(true)}
          onDecline={() => handleCookieConsent(false)}
        />
      )}

      <main className="flex-grow w-full max-w-full mx-auto py-4 mt-16 sm:mt-20 md:mt-24 pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>

      <Footer />

      <div className="fixed right-4 bottom-24 md:bottom-6 z-50 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleSeniorMode}
          className="touch-target px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700"
          aria-label="Toggle senior mode"
        >
          {seniorMode ? t("accessibility.normal") || "A Normal" : t("accessibility.large") || "A+"}
        </button>
        <a
          href="tel:0824761787"
          className="touch-target px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg text-center hover:bg-emerald-700"
        >
          {t("help.call") || "Call Help"}
        </a>
      </div>

      {!hideBottomNav && <BottomNavigation cartCount={0} />}
    </div>
  );
}
