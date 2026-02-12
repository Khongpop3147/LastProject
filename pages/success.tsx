import Head from "next/head";
import Link from "next/link";
import {
  CheckCircle2,
  CircleHelp,
  Home,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";

export default function SuccessPage() {
  return (
    <>
      <Head>
        <title>ชำระเงินสำเร็จ</title>
      </Head>

      <div className="min-h-screen overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-4 pb-[112px] pt-4">
          <section className="rounded-[26px] border border-[#dbe2ef] bg-white p-5 shadow-[0_10px_26px_rgba(31,65,129,0.12)]">
            <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#e8f8ef] text-[#1a9a4c]">
              <CheckCircle2 className="h-12 w-12" strokeWidth={2.3} />
            </div>

            <h1 className="mt-3 text-center text-[40px] font-extrabold leading-none text-[#1a9a4c]">
              ชำระเงินสำเร็จ
            </h1>
            <p className="mt-2 text-center text-[18px] leading-snug text-[#4b5563]">
              ขอบคุณสำหรับคำสั่งซื้อของคุณ
              <br />
              เราจะดำเนินการจัดส่งให้เร็วที่สุด
            </p>

            <div className="mt-4 space-y-2 rounded-2xl bg-[#f7f9fd] p-3">
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">ตรวจสอบสถานะได้ที่หน้า ประวัติคำสั่งซื้อ</p>
              </div>
              <div className="flex items-start gap-2">
                <PackageSearch className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">เมื่อร้านส่งสินค้าแล้ว คุณสามารถติดตามพัสดุได้ทันที</p>
              </div>
              <div className="flex items-start gap-2">
                <CircleHelp className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">หากมีปัญหา สามารถติดต่อเจ้าหน้าที่ได้จากหน้า ติดต่อเรา</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                href="/orders"
                className="flex h-12 items-center justify-center rounded-xl bg-[#2f6ef4] text-[19px] font-semibold text-white"
              >
                ดูคำสั่งซื้อ
              </Link>
              <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-xl border border-[#2f6ef4] text-[19px] font-semibold text-[#2f6ef4]"
              >
                <Home className="mr-1 h-5 w-5" />
                กลับหน้าหลัก
              </Link>
            </div>
          </section>
        </div>

        <MobileShopBottomNav activePath="/account" />
      </div>
    </>
  );
}

