// components/CouponBanner.tsx
"use client";

import { ChevronRight, Ticket } from "lucide-react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function CouponBanner() {
  const { t } = useTranslation("common");

  return (
    <Link
      href="/coupons"
      aria-label="ไปยังหน้าคูปองส่วนลด"
      className="block rounded-2xl border border-[#cfd7e6] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-colors hover:border-[#c1cce1] my-4"
    >
      <div className="relative overflow-hidden rounded-2xl px-4 py-4">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-[#2f6ef4]" />

        <div className="ml-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#edf3ff] text-[#2f6ef4]">
              <Ticket className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[22px] font-bold leading-tight text-[#111827]">
                คูปองส่วนลด
              </h3>
              <p className="text-[15px] font-medium text-[#4b5563]">
                เลือกคูปองก่อนชำระเงิน
              </p>
            </div>
          </div>

          <div className="flex h-10 flex-shrink-0 items-center gap-0.5 rounded-xl bg-[#2f6ef4] px-3 text-white">
            <span className="text-[14px] font-semibold">ดูคูปอง</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
