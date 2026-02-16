// components/Layout.tsx
"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import MobileShopBottomNav from "./MobileShopBottomNav";

const PromoModal = dynamic(() => import("./PromoModal"), { ssr: false });
const CookieConsent = dynamic(() => import("./CookieConsent"), { ssr: false });
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
  const router = useRouter();
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
    <div className="flex flex-col min-h-screen bg-white md:bg-transparent overflow-x-hidden">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Fresh marketplace by ICN_FREEZE" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <PromoModal show={showPromo} onClose={() => setShowPromo(false)} />
      {showCookieConsent && (
        <CookieConsent
          onAccept={() => handleCookieConsent(true)}
          onDecline={() => handleCookieConsent(false)}
        />
      )}

      <main className="flex-grow w-full max-w-full mx-auto pt-0 pb-24 md:pb-4 overflow-x-hidden desktop-page md:px-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only (hidden on md and above) */}
      {!hideBottomNav && (
        <div className="block md:hidden">
          <MobileShopBottomNav
            activePath={
              router.pathname === "/all-products"
                ? "/all-products"
                : router.pathname
            }
          />
        </div>
      )}
    </div>
  );
}
