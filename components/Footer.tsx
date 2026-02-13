// components/Footer.tsx
"use client";

import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

export default function Footer() {
  const { t } = useTranslation("common");
  const linkClass =
    "!text-white/90 hover:!text-white hover:underline underline-offset-4 transition-colors";

  return (
    <footer className="hidden md:block border-t border-teal-700 bg-teal-800 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center">
          <Link href="/qa" className={linkClass}>
            {t("footer.faq")}
          </Link>
          <Link href="/contact" className={linkClass}>
            {t("footer.contact")}
          </Link>
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

        <p className="mt-5 text-center text-xs sm:text-sm text-white/95">
          &copy; {new Date().getFullYear()} {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
