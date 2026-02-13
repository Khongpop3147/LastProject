import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  CheckCircle2,
  CircleHelp,
  Home,
  PackageSearch,
  ShoppingBag,
  Upload,
  AlertCircle,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";

export default function SuccessPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { orderId, paymentMethod, totalAmount } = router.query;

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const showUploadForm =
    paymentMethod === "bank_transfer" && orderId && !uploadSuccess;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("ไฟล์ใหญ่เกิน 10MB");
        return;
      }
      setSlipFile(file);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!slipFile || !orderId) return;

    const authToken = token ?? Cookies.get("token") ?? "";
    if (!authToken) {
      router.push("/login");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("slip", slipFile);

      const res = await fetch(`/api/orders/${orderId}/upload-slip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setUploadError(json.error ?? "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      setUploadSuccess(true);
      setSlipFile(null);
    } catch (error) {
      setUploadError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploading(false);
    }
  };

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
              สั่งซื้อสำเร็จ
            </h1>
            <p className="mt-2 text-center text-[18px] leading-snug text-[#4b5563]">
              ขอบคุณสำหรับคำสั่งซื้อของคุณ
              {totalAmount && (
                <>
                  <br />
                  <span className="text-[24px] font-bold text-[#1f2937]">
                    ยอดชำระ: ฿{Number(totalAmount).toLocaleString("th-TH")}
                  </span>
                </>
              )}
            </p>

            {showUploadForm && (
              <div className="mt-4 rounded-2xl border border-[#fbbf24] bg-[#fffbeb] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-[#f59e0b]" />
                  <h2 className="text-[20px] font-bold text-[#92400e]">
                    อัปโหลดสลิปโอนเงิน
                  </h2>
                </div>

                <div className="mb-3 rounded-xl bg-white p-3">
                  <p className="text-[15px] font-semibold text-[#1f2937]">
                    ธนาคารกสิกรไทย
                  </p>
                  <p className="text-[14px] text-[#6b7280]">
                    เลขที่บัญชี: 123-4-56789-0
                  </p>
                  <p className="text-[14px] text-[#6b7280]">
                    ชื่อบัญชี: บริษัท LastProject จำกัด
                  </p>
                </div>

                <p className="mb-3 text-[14px] text-[#92400e]">
                  กรุณาโอนเงินตามยอดที่แสดงด้านบนและอัปโหลดสลิปเพื่อยืนยันการชำระเงิน
                </p>

                <div className="space-y-2">
                  <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#2f6ef4] bg-[#edf3ff] text-[16px] font-semibold text-[#2f6ef4] hover:bg-[#dce4ff]">
                    <Upload className="mr-2 h-5 w-5" />
                    {slipFile ? slipFile.name : "เลือกไฟล์สลิป"}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>

                  {slipFile && (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="h-12 w-full rounded-xl bg-[#2f6ef4] text-[18px] font-semibold text-white disabled:opacity-50"
                    >
                      {uploading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
                    </button>
                  )}

                  {uploadError && (
                    <p className="rounded-lg bg-[#fff2f2] px-3 py-2 text-[14px] text-[#db4f4f]">
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 rounded-2xl border border-[#22c55e] bg-[#f0fdf4] p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
                  <p className="text-[16px] font-semibold text-[#166534]">
                    อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากทางร้าน
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2 rounded-2xl bg-[#f7f9fd] p-3">
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  ตรวจสอบสถานะได้ที่หน้า ประวัติคำสั่งซื้อ
                </p>
              </div>
              <div className="flex items-start gap-2">
                <PackageSearch className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  เมื่อร้านส่งสินค้าแล้ว คุณสามารถติดตามพัสดุได้ทันที
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CircleHelp className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2f6ef4]" />
                <p className="text-[15px] text-[#374151]">
                  หากมีปัญหา สามารถติดต่อเจ้าหน้าที่ได้จากหน้า ติดต่อเรา
                </p>
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
