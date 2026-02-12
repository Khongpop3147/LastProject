import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import Layout from "@/components/Layout";
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
    return `${coupon.discountValue}%`;
  }
  return `${coupon.discountValue} ฿`;
}

function isExpired(coupon: CouponRow) {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
}

function isDepleted(coupon: CouponRow) {
  if (coupon.usageLimit === null) return false;
  return coupon.usedCount >= coupon.usageLimit;
}

export default function CouponsPage({ coupons }: CouponsPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const availableCoupons = coupons.filter(
    (coupon) => !isExpired(coupon) && !isDepleted(coupon)
  );

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <Layout title="Coupons">
      <section className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">คูปองส่วนลด</h1>
        <p className="mb-6 text-gray-600">
          คัดลอกรหัสคูปองแล้วนำไปใช้ที่หน้าเช็คเอาต์
        </p>

        {availableCoupons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-600">
            ยังไม่มีคูปองที่ใช้งานได้ในตอนนี้
          </div>
        ) : (
          <div className="grid gap-4">
            {availableCoupons.map((coupon) => {
              const remaining =
                coupon.usageLimit === null
                  ? "ไม่จำกัดจำนวนครั้ง"
                  : `คงเหลือ ${Math.max(
                      coupon.usageLimit - coupon.usedCount,
                      0
                    )} ครั้ง`;

              return (
                <article
                  key={coupon.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">รหัสคูปอง</p>
                      <p className="text-2xl font-extrabold tracking-wide text-blue-700">
                        {coupon.code}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        ส่วนลด {formatDiscount(coupon)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {remaining}
                        {coupon.expiresAt
                          ? ` | หมดอายุ ${new Date(
                              coupon.expiresAt
                            ).toLocaleDateString("th-TH")}`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {copiedCode === coupon.code ? "คัดลอกแล้ว" : "คัดลอกโค้ด"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/checkout"
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            ไปหน้าเช็คเอาต์
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<CouponsPageProps> = async () => {
  const raw = await prisma.coupon.findMany({
    orderBy: { code: "asc" },
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
