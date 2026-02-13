import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { ArrowLeft, ReceiptText } from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";

type MethodId = "bank_transfer" | "cod";

type PaymentMethodItem = {
  id: MethodId;
  label: string;
  usedCount: number;
  lastUsedAt: string | null;
};

type MethodsResponse = {
  preferredMethod: MethodId;
  methods: PaymentMethodItem[];
};

type PaymentHistoryItem = {
  id: string;
  orderRef: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
};

type PaymentHistoryResponse = {
  items: PaymentHistoryItem[];
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function formatDateTime(input: string) {
  return new Date(input).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return "รอดำเนินการ";
  if (key === "PROCESSING") return "กำลังดำเนินการ";
  if (key === "SHIPPED") return "จัดส่งแล้ว";
  if (key === "COMPLETED") return "ชำระสำเร็จ";
  if (key === "CANCELLED") return "ยกเลิก";
  return status;
}

function getPaymentMethodLabel(method: string) {
  if (method === "bank_transfer") return "โอนผ่านธนาคาร";
  if (method === "cod") return "เก็บเงินปลายทาง";
  return method;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [historyItems, setHistoryItems] = useState<PaymentHistoryItem[]>([]);

  const fromCheckout = router.query.from === "checkout";

  const loadData = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [methodsRes, historyRes] = await Promise.all([
        fetch("/api/payments/methods", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/payments/history?limit=20", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const methodsJson = methodsRes.ok
        ? ((await methodsRes.json()) as MethodsResponse)
        : { preferredMethod: "bank_transfer" as MethodId, methods: [] };
      const historyJson = historyRes.ok
        ? ((await historyRes.json()) as PaymentHistoryResponse)
        : { items: [] };

      setMethods(methodsJson.methods ?? []);
      setHistoryItems(historyJson.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = () => {
    goBackOrPush(router, fromCheckout ? "/checkout" : "/account");
  };

  const bankTransferUsedCount =
    methods.find((m) => m.id === "bank_transfer")?.usedCount ?? 0;

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
          <div className="flex h-[92px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-7 w-7" strokeWidth={2.25} />
            </button>

            <div className="ml-4">
              <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-black">
                ตั้งค่า
              </h1>
              <p className="text-[16px] text-[#6b7280]">วิธีชำระเงิน</p>
            </div>
          </div>
        </header>

        <main className="px-4 pb-[120px] pt-4">
          {loading ? (
            <div className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[17px] text-[#6b7280]">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <>
              <section className="mb-6 rounded-2xl border border-[#d8d8d8] bg-white p-4">
                <h2 className="mb-3 text-[20px] font-bold text-[#1f2937]">
                  ช่องทางชำระเงิน
                </h2>

                <div className="rounded-xl bg-[#edf3ff] border border-[#2f6ef4] p-4">
                  <p className="text-[18px] font-semibold text-[#1f2937]">
                    โอนผ่านธนาคาร
                  </p>
                  <p className="text-[14px] text-[#6b7280] mt-1">
                    ใช้แล้ว {bankTransferUsedCount} ครั้ง
                  </p>
                  <p className="text-[13px] text-[#8a93a5] mt-2">
                    ชำระเงินผ่านการโอนเงินธนาคาร
                    พร้อมอัพโหลดสลิปเพื่อยืนยันการชำระเงิน
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[30px] font-extrabold text-[#1f2937]">
                  ประวัติการจ่ายเงิน
                </h2>

                {historyItems.length === 0 ? (
                  <div className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[16px] text-[#6b7280]">
                    ยังไม่มีประวัติการจ่ายเงิน
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyItems.map((item) => (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-[#d8d8d8] bg-white px-3 py-3 shadow-[0_2px_5px_rgba(0,0,0,0.08)]"
                      >
                        <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[14px] bg-[#dbe8ff] text-[#2f6ef4]">
                          <ReceiptText className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] text-[#4b5563]">
                            {formatDateTime(item.createdAt)}
                          </p>
                          <p className="truncate text-[18px] font-semibold text-[#1f2937]">
                            คำสั่งซื้อ #{item.orderRef}
                          </p>
                          <p className="text-[13px] text-[#6b7280]">
                            {getPaymentMethodLabel(item.paymentMethod)}
                          </p>
                          <p className="text-[12px] font-medium text-[#8a93a5]">
                            {getStatusLabel(item.status)}
                          </p>
                        </div>

                        <div className="whitespace-nowrap text-[22px] font-extrabold leading-none text-[#111827]">
                          {toCurrency(item.amount)}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
