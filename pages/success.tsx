import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import {
  CheckCircle2,
  CircleHelp,
  Home,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";

export default function SuccessPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { totalAmount } = router.query;

  return (
    <>
      <Head>
        <title>{t("success.title")}</title>
      </Head>

      <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto flex min-h-screen w-full max-w-[440px] md:max-w-5xl flex-col px-4 md:px-6 pb-[112px] md:pb-12 pt-4 md:pt-6 desktop-shell">
          <section className="rounded-[26px] border border-[#dbe2ef] bg-white p-5 md:p-6 shadow-[0_10px_26px_rgba(31,65,129,0.12)]">
            <div className="mx-auto flex h-[88px] w-[88px] md:h-[100px] md:w-[100px] items-center justify-center rounded-full bg-[#e8f8ef] text-[#1a9a4c]">
              <CheckCircle2
                className="h-12 w-12 md:h-14 md:w-14"
                strokeWidth={2.3}
              />
            </div>

            <h1 className="mt-3 text-center text-[40px] md:text-[44px] font-extrabold leading-none text-[#1a9a4c]">
              {t("success.heading")}
            </h1>
            <p className="mt-2 text-center text-[18px] md:text-[19px] leading-snug text-[#4b5563]">
              {t("success.thanks")}
              {totalAmount && (
                <>
                  <br />
                  <span className="text-[24px] md:text-[26px] font-bold text-[#1f2937]">
                    {t("success.totalPaid", {
                      amount: Number(totalAmount).toLocaleString("th-TH"),
                    })}
                  </span>
                </>
              )}
            </p>

            <div className="mt-4 space-y-2 rounded-2xl bg-[#f7f9fd] p-3">
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  {t("success.checkStatus")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <PackageSearch className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  {t("success.trackInfo")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CircleHelp className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  {t("success.contactInfo")}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                href="/orders"
                className="flex h-12 items-center justify-center rounded-xl bg-[#2f6ef4] text-[19px] font-semibold text-white"
              >
                {t("success.viewOrders")}
              </Link>
              <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-xl border border-[#2f6ef4] text-[19px] font-semibold text-[#2f6ef4]"
              >
                <Home className="mr-1 h-5 w-5" />
                {t("success.backToHome")}
              </Link>
            </div>
          </section>
        </div>

        <MobileShopBottomNav activePath="/account" />
      </div>
    </>
  );
}
