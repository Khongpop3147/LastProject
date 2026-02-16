// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RotateCcw, Smartphone } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appWithI18n from "next-translate/appWithI18n";
import i18nConfig from "../i18n.json";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });

// สร้าง instance เดียวตลอดแอป
const queryClient = new QueryClient();

const desktopChromeHiddenPathnames = new Set(["/debug"]);
const desktopChromeHiddenPrefixes = ["/admin"];
const DESKTOP_CHROME_OFFSET_CLASS = "md:pt-[156px]";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const showDesktopChrome =
    !desktopChromeHiddenPathnames.has(router.pathname) &&
    !desktopChromeHiddenPrefixes.some(
      (prefix) =>
        router.pathname === prefix || router.pathname.startsWith(`${prefix}/`),
    );

  useEffect(() => {
    const detectMobileLandscape = () => {
      if (typeof window === "undefined") return;

      const isMobileDevice = window.matchMedia(
        "(max-width: 1024px) and (pointer: coarse)",
      ).matches;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      setIsMobileLandscape(isMobileDevice && isLandscape);
    };

    detectMobileLandscape();
    window.addEventListener("resize", detectMobileLandscape);
    window.addEventListener("orientationchange", detectMobileLandscape);

    return () => {
      window.removeEventListener("resize", detectMobileLandscape);
      window.removeEventListener("orientationchange", detectMobileLandscape);
    };
  }, []);

  useEffect(() => {
    if (isMobileLandscape) {
      document.body.style.overflow = "hidden";
      return;
    }
    document.body.style.overflow = "";
  }, [isMobileLandscape]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="screen-orientation" content="portrait" />
        <meta name="orientation" content="portrait" />
      </Head>

      {/* ครอบด้วย React Query provider */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {showDesktopChrome ? <Navbar /> : null}

          <div
            className={
              showDesktopChrome ? DESKTOP_CHROME_OFFSET_CLASS : undefined
            }
          >
            <Component {...pageProps} />
          </div>

          {showDesktopChrome ? <Footer /> : null}
          {isMobileLandscape ? (
            <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[#f8faff] px-6">
              <div
                role="alert"
                aria-live="assertive"
                className="w-full max-w-[380px] rounded-3xl border border-[#d7deea] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
              >
                <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-[#eef3ff] px-4 py-3">
                  <Smartphone className="h-8 w-8 text-[#2f6ef4]" />
                  <RotateCcw className="h-7 w-7 text-[#2f6ef4]" />
                </div>
                <p className="mt-4 text-[30px] font-extrabold leading-tight text-[#1f2937]">
                  รองรับเฉพาะแนวตั้ง
                </p>
                <p className="mt-2 text-[18px] font-medium leading-snug text-[#4b5563]">
                  กรุณาหมุนหน้าจอกลับเป็นแนวตั้ง
                  <br />
                  เพื่อใช้งานต่อ
                </p>
              </div>
            </div>
          ) : null}
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithI18n(MyApp as any, i18nConfig);
