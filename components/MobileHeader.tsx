// components/MobileHeader.tsx
"use client";

import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

export default function MobileHeader() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = searchQuery.trim();
    if (!keyword) {
      router.push("/all-products");
      return;
    }

    router.push(`/all-products?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div
      className="sticky top-0 z-50 border-b border-[#d8dbe2] bg-white shadow-sm"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[440px] px-3 pb-2.5 pt-2"
      >
        <div className="flex w-full min-w-0 items-center gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
          >
            <div className="relative h-9 w-9">
              <Image
                src="/images/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          {/* Search Bar */}
          <div className="relative min-w-0 flex-1">
            <div className="relative h-11">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4b5563]" />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                placeholder={t("mobile.searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full w-full rounded-2xl border-2 border-[#b7c3d8] bg-[#e8eef8] pl-10 pr-10 text-[17px] font-medium text-[#1f2937] placeholder:text-[#6b7280] outline-none transition-all focus:border-[#2f6ef4] focus:bg-white"
                aria-label={t("mobile.searchProducts")}
              />
              {searchQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("mobile.clearSearch")}
                  className="tap-target absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#4b5563]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            className="h-11 flex-shrink-0 rounded-xl bg-[#2f6ef4] px-3.5 text-[16px] font-semibold text-white"
          >
            {t("mobile.search")}
          </button>
        </div>
      </form>
    </div>
  );
}
