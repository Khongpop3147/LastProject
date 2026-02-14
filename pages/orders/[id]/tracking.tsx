import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";
import { parseAddressLine2 } from "@/lib/addressLine2";
import useTranslation from "next-translate/useTranslation";

type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: string;
    name?: string | null;
    imageUrl?: string | null;
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  };
};

type OrderDetail = {
  id: string;
  locale?: string;
  recipient: string;
  line1: string;
  line2?: string | null;
  line3?: string | null;
  city: string;
  postalCode?: string | null;
  country: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type OrderResponse = {
  order?: OrderDetail;
  error?: string;
};

type TimelineStep = {
  key: "PROCESSING" | "SHIPPED" | "COMPLETED";
  title: string;
  description: string;
};

const STEPS: TimelineStep[] = [
  {
    key: "PROCESSING",
    title: "รับพัสดุจากคลังสินค้า",
    description: "ร้านค้ากำลังเตรียมและแพ็กสินค้า",
  },
  {
    key: "SHIPPED",
    title: "กำลังจัดส่ง",
    description: "พัสดุกำลังเดินทางไปยังที่อยู่ปลายทาง",
  },
  {
    key: "COMPLETED",
    title: "ส่งปลายทาง",
    description: "พัสดุจัดส่งสำเร็จ",
  },
];

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toCurrency(value: number, locale: "th" | "en") {
  const formatterLocale = locale === "en" ? "en-US" : "th-TH";
  return `฿${value.toLocaleString(formatterLocale)}`;
}

function toOrderRef(id: string) {
  return `#${id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase()}`;
}

function resolveProductName(
  item: OrderItem,
  locale: "th" | "en",
  orderLocale?: "th" | "en",
) {
  const primaryLocale = orderLocale ?? locale;
  const localized = item.product.translations?.find(
    (translation) => translation.locale === primaryLocale,
  )?.name;
  if (localized) return localized;
  const fallbackUi = item.product.translations?.find(
    (translation) => translation.locale === locale,
  )?.name;
  if (fallbackUi) return fallbackUi;
  if (item.product.translations?.[0]?.name) return item.product.translations[0].name;
  if (item.product.name) return item.product.name;
  return locale === "en" ? "Product" : "สินค้า";
}

function statusRank(status: string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return 0;
  if (key === "PROCESSING") return 1;
  if (key === "SHIPPED") return 2;
  if (key === "COMPLETED") return 3;
  return -1;
}

function formatTime(input: string, locale: "th" | "en") {
  const formatterLocale = locale === "en" ? "en-US" : "th-TH";
  return new Date(input).toLocaleTimeString(formatterLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(order: OrderDetail) {
  return [order.line1, order.line3, order.city, order.postalCode, order.country]
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0)
    .join(" ");
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { lang } = useTranslation("common");
  const locale: "th" | "en" = lang === "en" ? "en" : "th";

  const orderId = typeof router.query.id === "string" ? router.query.id : "";
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}?locale=${locale}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = (await res.json()) as OrderResponse;
      if (!res.ok || !json.order) {
        setOrder(null);
        setErrorMessage(json.error ?? "ไม่พบข้อมูลคำสั่งซื้อ");
        return;
      }
      setOrder(json.order);
    } finally {
      setLoading(false);
    }
  }, [locale, orderId, router, token]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const line2Meta = useMemo(() => {
    return parseAddressLine2(order?.line2);
  }, [order?.line2]);

  const currentRank = useMemo(() => {
    return statusRank(order?.status ?? "");
  }, [order?.status]);

  const handleBack = () => {
    goBackOrPush(router, "/orders");
  };

  const handleConfirmReceived = async () => {
    if (!order) return;
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) return;
      await loadOrder();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="app-page-container-narrow md:mt-8 desktop-shell">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
          <div className="flex h-[66px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <div className="ml-3 min-w-0">
              <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-black">
                ติดตามพัสดุ
              </h1>
              <p className="truncate text-[15px] font-semibold text-teal-700">
                {order ? toOrderRef(order.id) : "-"}
              </p>
            </div>

            <button
              type="button"
              aria-label="รีเฟรช"
              onClick={loadOrder}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eceff5] text-[#4b5563]"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <div className="hidden md:block px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[32px] font-extrabold text-teal-900">
                ติดตามพัสดุ
              </h1>
              <p className="text-[17px] font-semibold text-teal-700">
                {order ? toOrderRef(order.id) : "-"}
              </p>
            </div>
            <button
              type="button"
              aria-label="รีเฟรช"
              onClick={loadOrder}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eceff5] text-[#4b5563] hover:bg-teal-50 transition-colors"
            >
              <RefreshCw className="h-6 w-6" />
            </button>
          </div>
        </div>

        <main className="space-y-3 px-4 pb-[190px] pt-4 md:px-6 md:pb-12 md:pt-0">
          {loading ? (
            <div className="flex h-[280px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-teal-700" />
            </div>
          ) : errorMessage || !order ? (
            <div className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-4 py-3 text-[17px] text-[#db4f4f]">
              {errorMessage || "ไม่พบข้อมูลคำสั่งซื้อ"}
            </div>
          ) : (
            <>
              {/* Desktop two-column / Mobile single-column */}
              <div className="md:grid md:grid-cols-[1fr_380px] md:gap-6 md:items-start">
                {/* Left column: Shipping status */}
                <section className="rounded-2xl border border-[#d8d8d8] bg-white p-4 md:p-5 md:hover:shadow-sm md:transition-shadow">
                  <h2 className="text-[19px] md:text-[24px] font-extrabold text-[#111827]">
                    สถานะการจัดส่ง
                  </h2>

                  {order.status.toUpperCase() === "CANCELLED" ? (
                    <p className="mt-2 rounded-xl bg-[#ffeef0] px-3 py-2 text-[16px] font-semibold text-[#e44a59]">
                      คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                    </p>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {STEPS.map((step, index) => {
                        const rank = index + 1;
                        const done = currentRank > rank;
                        const active = currentRank === rank;
                        const pending = currentRank < rank;

                        return (
                          <div
                            key={step.key}
                            className="relative flex items-start gap-3"
                          >
                            {index !== STEPS.length - 1 ? (
                              <div
                                className={`absolute left-[21px] top-10 h-[38px] md:h-[42px] w-1 rounded-full ${
                                  done || active
                                    ? "bg-[#22c55e]"
                                    : "bg-[#d1d5db]"
                                }`}
                              />
                            ) : null}

                            <div
                              className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                                done
                                  ? "bg-[#22c55e] text-white"
                                  : active
                                    ? "bg-teal-500 text-white"
                                    : "bg-[#e5e7eb] text-[#6b7280]"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : step.key === "SHIPPED" ? (
                                <Truck className="h-6 w-6" />
                              ) : (
                                <Package className="h-6 w-6" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-[18px] md:text-[21px] font-bold leading-tight text-[#111827]">
                                  {step.title}
                                </p>
                                <span
                                  className={`text-[14px] md:text-[16px] font-semibold ${
                                    active ? "text-teal-600" : "text-[#6b7280]"
                                  }`}
                                >
                                  {done || active
                                    ? step.key === "PROCESSING"
                                      ? formatTime(order.createdAt, locale)
                                      : formatTime(order.updatedAt, locale)
                                    : "-"}
                                </span>
                              </div>
                              <p
                                className={`mt-0.5 text-[14px] md:text-[16px] leading-tight ${
                                  pending ? "text-[#9ca3af]" : "text-[#4b5563]"
                                }`}
                              >
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Right column: Products + Address */}
                <div className="space-y-3 mt-3 md:mt-0">
                  <section className="rounded-2xl border border-[#d8d8d8] bg-white p-4 md:p-5 md:hover:shadow-sm md:transition-shadow">
                    <h2 className="text-[19px] md:text-[24px] font-extrabold text-[#111827]">
                      รายการสินค้า ({order.items.length} รายการ)
                    </h2>
                    <div className="mt-2 space-y-2">
                      {order.items.map((item) => {
                        const orderLocale = order.locale === "en" ? "en" : "th";
                        const name = resolveProductName(item, locale, orderLocale);
                        return (
                          <article
                            key={item.id}
                            className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] p-2.5 md:hover:border-teal-200 md:transition-colors"
                          >
                            <div className="h-[74px] w-[74px] flex-shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb]">
                              <img
                                src={
                                  item.product.imageUrl ||
                                  "/images/placeholder.png"
                                }
                                alt={name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-[16px] md:text-[18px] font-semibold leading-tight text-[#111827]">
                                {name}
                              </h3>
                              <p className="text-[14px] md:text-[15px] text-[#6b7280]">
                                จำนวน {item.quantity} ชิ้น
                              </p>
                              <p className="text-[22px] md:text-[24px] font-extrabold leading-none text-teal-700">
                                {toCurrency(
                                  item.priceAtPurchase * item.quantity,
                                  locale,
                                )}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#d8d8d8] bg-white p-4 md:p-5 md:hover:shadow-sm md:transition-shadow">
                    <div className="mb-1 flex items-center">
                      <MapPin className="h-6 w-6 text-teal-700" />
                      <h2 className="ml-2 text-[19px] md:text-[24px] font-extrabold text-[#111827]">
                        ที่อยู่จัดส่ง
                      </h2>
                    </div>
                    <p className="text-[16px] md:text-[18px] font-semibold text-[#1f2937]">
                      {order.recipient}
                      {line2Meta.phone ? ` ${line2Meta.phone}` : ""}
                    </p>
                    <p className="text-[14px] md:text-[16px] leading-tight text-[#4b5563]">
                      {formatAddress(order)}
                    </p>
                  </section>
                </div>
              </div>

              {/* Desktop inline action buttons */}
              <div className="hidden md:flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  className="flex flex-1 items-center justify-center rounded-xl border border-teal-600 py-3 text-[18px] font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
                >
                  ดูคำสั่งซื้อ
                </button>
                {order.status.toUpperCase() === "SHIPPED" ? (
                  <button
                    type="button"
                    onClick={handleConfirmReceived}
                    disabled={confirming}
                    className="flex flex-1 items-center justify-center rounded-xl bg-teal-600 py-3 text-[18px] font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
                  >
                    {confirming ? "กำลังอัปเดต..." : "ยืนยันรับสินค้า"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loadOrder}
                    className="flex flex-1 items-center justify-center rounded-xl bg-teal-600 py-3 text-[18px] font-semibold text-white hover:bg-teal-700 transition-colors"
                  >
                    รีเฟรชสถานะ
                  </button>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile bottom action bar */}
      {order && !loading ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d8d8d8] bg-white md:hidden"
          style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex w-full max-w-[440px] gap-2 px-4 pb-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-teal-600 py-2 text-[16px] font-semibold text-teal-600"
            >
              ดูคำสั่งซื้อ
            </button>
            {order.status.toUpperCase() === "SHIPPED" ? (
              <button
                type="button"
                onClick={handleConfirmReceived}
                disabled={confirming}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-teal-600 py-2 text-[16px] font-semibold text-white disabled:opacity-60"
              >
                {confirming ? "กำลังอัปเดต..." : "ยืนยันรับสินค้า"}
              </button>
            ) : (
              <button
                type="button"
                onClick={loadOrder}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-teal-600 py-2 text-[16px] font-semibold text-white"
              >
                รีเฟรชสถานะ
              </button>
            )}
          </div>
        </div>
      ) : null}

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
