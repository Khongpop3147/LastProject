// components/Footer.tsx
"use client";

import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

export default function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-green-800 text-white">
      <div className="container py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 text-center">
          <Link href="/qa" className="hover:underline">
            {t("footer.faq")}
          </Link>
          <Link href="/contact" className="hover:underline">
            {t("footer.contact")}
          </Link>
          <Link href="/privacy-policy" className="hover:underline">
            {t("footer.privacy")}
          </Link>
          <Link href="/cookie-policy" className="hover:underline">
            {t("footer.cookies")}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t("footer.terms")}
          </Link>
        </div>
        <p className="text-center text-xs sm:text-sm mt-6">
          © {new Date().getFullYear()} {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
