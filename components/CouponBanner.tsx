// components/CouponBanner.tsx
"use client";

import { Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CouponBanner() {
  return (
    <Link href="/coupons">
      <div className="mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"> 
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div className="text-white">
            <h3 className="font-bold text-base md:text-lg">คูปองส่วนลด</h3>
            <p className="text-xs md:text-sm text-white/90">เก็บคูปองส่วนลดพิเศษ!</p>
          </div>
        </div>
        <ArrowRight className="w-6 h-6 text-white flex-shrink-0" />
      </div>
    </Link>
  );
}
