import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Copy,
  Percent,
  Ticket,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

type CouponRow = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
};

type CouponsPageProps = {
  coupons: CouponRow[];
};

function formatDiscount(coupon: CouponRow) {
  if (coupon.discountType === "percent") {
    return `ลด ${coupon.discountValue}%`;
  }
  return `ลด ฿${coupon.discountValue.toLocaleString("th-TH")}`;
}

function isExpired(coupon: CouponRow) {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt).getTime() < Date.now();
}

function isDepleted(coupon: CouponRow) {
  if (coupon.usageLimit === null) return false;
  return coupon.usedCount >= coupon.usageLimit;
}

function getRemaining(coupon: CouponRow) {
  if (coupon.usageLimit === null) return null;
  return Math.max(coupon.usageLimit - coupon.usedCount, 0);
}

function formatExpireDate(expiresAt: string | null) {
  if (!expiresAt) return "ไม่มีวันหมดอายุ";
  return new Date(expiresAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CouponsPage({ coupons }: CouponsPageProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const availableCoupons = useMemo(
    () => coupons.filter((coupon) => !isExpired(coupon) && !isDepleted(coupon)),
    [coupons],
  );

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setCopiedCode(null);
    }
  };

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f5f7] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="sticky top-0 z-40 border-b border-[#d7d9df] bg-[#f4f5f7]">
          <div className="flex h-[84px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dde3ee] text-[#2c3443]"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
            </button>

            <div className="ml-4 min-w-0">
              <h1 className="truncate text-[34px] font-extrabold leading-none tracking-tight text-black">
                คูปองส่วนลด
              </h1>
              <p className="truncate text-[14px] text-[#6b7280]">
                คัดลอกรหัสแล้วนำไปใช้ตอนชำระเงิน
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-3 px-4 pb-[116px] pt-4">
          <section className="rounded-2xl border border-[#d8dce5] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#ecf2ff] text-[#2f6ef4]">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[22px] font-bold leading-tight text-[#111827]">
                    คูปองที่ใช้ได้ {availableCoupons.length} ใบ
                  </p>
                  <p className="truncate text-[14px] text-[#6b7280]">
                    แตะคัดลอกรหัส แล้วนำไปใช้ที่หน้าเช็กเอาต์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="h-10 flex-shrink-0 rounded-xl border border-[#2f6ef4] px-4 text-[15px] font-semibold text-[#2f6ef4]"
              >
                เช็กเอาต์
              </button>
            </div>
          </section>

          {availableCoupons.length === 0 ? (
            <section className="rounded-2xl border border-[#d8dce5] bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf1f8] text-[#8791a3]">
                <Percent className="h-7 w-7" />
              </div>
              <h2 className="mt-3 text-[30px] font-extrabold text-[#1f2937]">
                ยังไม่มีคูปองตอนนี้
              </h2>
              <p className="mt-1 text-[16px] leading-relaxed text-[#6b7280]">
                ลองกลับมาตรวจสอบอีกครั้งในภายหลัง
              </p>
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="mt-4 h-11 rounded-xl bg-[#2f6ef4] px-5 text-[17px] font-semibold text-white"
              >
                ไปหน้าเช็กเอาต์
              </button>
            </section>
          ) : (
            <section className="space-y-2.5">
              {availableCoupons.map((coupon) => {
                const remaining = getRemaining(coupon);
                const isCopied = copiedCode === coupon.code;
                return (
                  <article
                    key={coupon.id}
                    className="rounded-2xl border border-[#d8dce5] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-[#edf3ff] px-2.5 py-1 text-[14px] font-semibold text-[#2f6ef4]">
                          {formatDiscount(coupon)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className={`flex h-10 items-center rounded-xl border px-3 text-[15px] font-semibold ${
                          isCopied
                            ? "border-[#9ad6b3] bg-[#e9f6ef] text-[#1f8b52]"
                            : "border-[#cfd5e3] bg-white text-[#1f2937]"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            คัดลอกแล้ว
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-4 w-4" />
                            คัดลอก
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl bg-[#f7f8fb] px-3 py-3">
                      <p className="text-[13px] text-[#6b7280]">รหัสคูปอง</p>
                      <p className="mt-1 break-all text-[23px] font-bold leading-tight tracking-[0.03em] text-[#1f3b87]">
                        {coupon.code}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-[14px] text-[#4b5563]">
                      <div className="flex items-center justify-between gap-2">
                        <span>จำนวนสิทธิ์คงเหลือ</span>
                        <span className="font-semibold text-[#1f2937]">
                          {remaining === null ? "ไม่จำกัด" : `${remaining} ครั้ง`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center">
                          <CalendarClock className="mr-1 h-4 w-4 text-[#7b8495]" />
                          วันหมดอายุ
                        </span>
                        <span className="font-semibold text-[#1f2937]">
                          {formatExpireDate(coupon.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {availableCoupons.length > 0 ? (
            <section className="rounded-2xl border border-[#d8dce5] bg-white p-4">
              <p className="text-[15px] leading-relaxed text-[#4b5563]">
                หลังจากคัดลอกรหัสแล้ว ไปที่หน้าเช็กเอาต์และกด
                <span className="font-semibold text-[#2f6ef4]"> ใช้คูปอง </span>
                เพื่อรับส่วนลด
              </p>

              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="mt-3 h-11 w-full rounded-xl bg-[#2f6ef4] text-[17px] font-semibold text-white"
              >
                ไปหน้าเช็กเอาต์
              </button>
            </section>
          ) : null}
        </main>
      </div>

      <MobileShopBottomNav activePath="/coupons" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CouponsPageProps> = async () => {
  const raw = await prisma.coupon.findMany({
    orderBy: [{ expiresAt: "asc" }, { code: "asc" }],
  });

  const coupons: CouponRow[] = raw.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
  }));

  return {
    props: { coupons },
  };
};
