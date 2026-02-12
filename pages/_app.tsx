// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Router from "next/router";
import { Loader2, RotateCcw, Smartphone } from "lucide-react";

// เปลี่ยนเป็น import จาก next-translate-plugin
import appWithI18n from "next-translate/appWithI18n";
import i18nConfig from "../i18n.json";

function MyApp({ Component, pageProps }: AppProps) {
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const loaderDelayRef = useRef<number | null>(null);

  useEffect(() => {
    const handleRouteChangeStart = (nextUrl: string) => {
      if (nextUrl === Router.asPath) return;

      if (loaderDelayRef.current !== null) {
        window.clearTimeout(loaderDelayRef.current);
      }

      // หน่วงเล็กน้อยเพื่อลดการกระพริบในกรณีเปลี่ยนหน้าเร็วมาก
      loaderDelayRef.current = window.setTimeout(() => {
        setIsRouteLoading(true);
      }, 120);
    };

    const handleRouteChangeDone = () => {
      if (loaderDelayRef.current !== null) {
        window.clearTimeout(loaderDelayRef.current);
        loaderDelayRef.current = null;
      }
      setIsRouteLoading(false);
    };

    Router.events.on("routeChangeStart", handleRouteChangeStart);
    Router.events.on("routeChangeComplete", handleRouteChangeDone);
    Router.events.on("routeChangeError", handleRouteChangeDone);

    return () => {
      Router.events.off("routeChangeStart", handleRouteChangeStart);
      Router.events.off("routeChangeComplete", handleRouteChangeDone);
      Router.events.off("routeChangeError", handleRouteChangeDone);
      if (loaderDelayRef.current !== null) {
        window.clearTimeout(loaderDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const detectMobileLandscape = () => {
      if (typeof window === "undefined") return;

      const isMobileDevice = window.matchMedia(
        "(max-width: 1024px) and (pointer: coarse)"
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
      <AuthProvider>
        <Component {...pageProps} />
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
        {isRouteLoading ? (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/10 px-5">
            <div
              role="status"
              aria-live="polite"
              className="w-full max-w-[292px] rounded-2xl border border-[#d9deea] bg-white px-5 py-5 text-center shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1ff]">
                <Loader2 className="h-7 w-7 animate-spin text-[#2f6ef4]" />
              </div>
              <p className="mt-4 text-[18px] font-semibold text-[#1f2937]">
                กำลังโหลดหน้า...
              </p>
              <p className="mt-1 text-[14px] text-[#6b7280]">
                กรุณารอสักครู่
              </p>
            </div>
          </div>
        ) : null}
      </AuthProvider>
    </>
  );
}

// ห่อด้วย HOC จาก plugin
export default appWithI18n(MyApp as any, i18nConfig);
