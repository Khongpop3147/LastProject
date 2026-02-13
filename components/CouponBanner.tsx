// components/CouponBanner.tsx
"use client";

import { Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function CouponBanner() {
  const { t } = useTranslation("common");

  return (
    <Link href="/promotions">
      <div className="mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 rounded-3xl p-[1px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 shadow-md hover:shadow-xl transition-all cursor-pointer">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg md:text-xl">{t("couponBanner.title") || "Coupons"}</h3>
              <p className="text-sm md:text-base text-white/95">
                {t("couponBanner.subtitle") || "Grab your special discount coupons."}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/20 flex items-center justify-center ring-1 ring-white/20">
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}
