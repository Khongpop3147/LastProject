// components/Footer.tsx
"use client";

import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

export default function Footer() {
  const { t } = useTranslation("common");
  const linkClass =
    "text-white/90 hover:text-white hover:underline underline-offset-4 transition-colors";

  return (
    <footer className="hidden md:block border-t border-[#0f7078] bg-gradient-to-b from-[#0f6a72] to-[#0b5c63] text-white">
      <div className="mx-auto w-full max-w-[1360px] px-6 pb-8 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <section>
            <h2 className="text-[24px] font-extrabold tracking-tight text-white">
              ICN_FREEZE
            </h2>
            <p className="mt-2 max-w-[560px] text-[17px] leading-relaxed text-white/90">
              {t("footer.a11yDesc")}
            </p>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-white">
              {t("footer.helpMenu")}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-[16px]">
              <Link href="/qa" className={linkClass}>
                {t("footer.faq")}
              </Link>
              <Link href="/contact" className={linkClass}>
                {t("footer.contact")}
              </Link>
            </div>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-white">
              {t("footer.policyMenu")}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-[16px]">
              <Link href="/privacy-policy" className={linkClass}>
                {t("footer.privacy")}
              </Link>
              <Link href="/cookie-policy" className={linkClass}>
                {t("footer.cookies")}
              </Link>
              <Link href="/terms" className={linkClass}>
                {t("footer.terms")}
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/20 pt-5 text-[14px] text-white/80 lg:flex-row lg:items-center">
          <p>
            &copy; {new Date().getFullYear()} {t("footer.rights")}
          </p>
          <p>Desktop experience upgraded for clarity and comfort.</p>
        </div>
      </div>
    </footer>
  );
}
