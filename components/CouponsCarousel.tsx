"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";
import useTranslation from "next-translate/useTranslation";

// Mirror your Prisma model
type Coupon = {
  id: string;
  code: string;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string; // ISO date string
};

export default function CouponsCarousel() {
  const { t, lang } = useTranslation("common");

  const { data, isLoading, isError } = useQuery<{ items: Coupon[] }>(
    {
      queryKey: ["coupons"],
      queryFn: () =>
        fetch(`/api/coupons?locale=${lang}`)
          .then((res) => res.json()) as Promise<{ items: Coupon[] }>,
    }
  );

  if (isLoading) return <p>{t("coupons.loading")}</p>;
  if (isError)   return <p>{t("coupons.error")}</p>;

  const coupons = data?.items ?? [];

  function scroll(ev: MouseEvent, offset: number) {
    ev.preventDefault();
    document
      .getElementById("coupon-slider")
      ?.scrollBy({ left: offset, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => scroll(e, -300)}
        className="absolute left-0 top-1/2 z-10 p-2 bg-white rounded-full shadow"
      >
        <ArrowLeft size={20} />
      </button>

      <div
        id="coupon-slider"
        className="flex space-x-4 overflow-x-auto scrollbar-hide px-4"
      >
        {coupons.map((c) => (
          <div key={c.id} className="min-w-[240px] flex-shrink-0 relative">
            <div className="bg-gray-800 text-white rounded-lg p-4 relative">
              {/* Copy code */}
              <button
                onClick={() => navigator.clipboard.writeText(c.code)}
                className="absolute top-2 right-3 text-sm underline"
              >
                {t("coupons.copy")}
              </button>

              {/* Discount label */}
              {c.discountType === "AMOUNT" ? (
                <h4 className="text-2xl font-bold mb-2">
                  {t("coupons.offAmt", { value: c.discountValue })}
                </h4>
              ) : (
                <h4 className="text-2xl font-bold mb-2">
                  {t("coupons.offPct", { value: c.discountValue })}
                </h4>
              )}

              {/* Code line */}
              <p className="text-sm mb-1">
                {t("coupons.enterCode")} {c.code}
              </p>

              {/* Optional: remaining usage */}
              {c.usageLimit != null && (
                <p className="text-xs text-gray-300 mb-0.5">
                  {t("coupons.remaining", {
                    count: c.usageLimit - c.usedCount,
                  })}
                </p>
              )}

              {/* Optional: expiration date */}
              {c.expiresAt && (
                <p className="text-xs text-gray-300">
                  {t("coupons.expires", {
                    date: new Date(c.expiresAt).toLocaleDateString(
                      lang === "th" ? "th-TH" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    ),
                  })}
                </p>
              )}
            </div>

            {/* Ticket-notch decoration */}
            <div className="absolute left-0 top-1/2 w-4 h-4 bg-white rounded-full -translate-y-1/2 -translate-x-1/2" />
            <div className="absolute right-0 top-1/2 w-4 h-4 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
        ))}
      </div>

      <button
        onClick={(e) => scroll(e, +300)}
        className="absolute right-0 top-1/2 z-10 p-2 bg-white rounded-full shadow"
      >
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
