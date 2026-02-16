import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Box,
  ChevronRight,
  Loader2,
  PackageCheck,
  Search,
  Store,
  Truck,
  Upload,
  UserCircle2,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";

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

type OrderSummary = {
  id: string;
  locale?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string | null;
  slipUrl?: string | null;
  items: OrderItem[];
};

type DesktopOrderTab =
  | "ALL"
  | "TO_PAY"
  | "TO_SHIP"
  | "TO_RECEIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND";

const DESKTOP_ORDER_TABS: DesktopOrderTab[] = [
  "ALL",
  "TO_PAY",
  "TO_SHIP",
  "TO_RECEIVE",
  "COMPLETED",
  "CANCELLED",
  "REFUND",
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

function statusLabel(status: string, t: (key: string) => string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return t("ordersPage.statusPending");
  if (key === "PROCESSING") return t("ordersPage.statusProcessing");
  if (key === "SHIPPED") return t("ordersPage.statusShipped");
  if (key === "COMPLETED") return t("ordersPage.statusCompleted");
  if (key === "CANCELLED") return t("ordersPage.statusCancelled");
  if (key.includes("REFUND")) return t("ordersPage.tabRefund");
  return status;
}

function statusClass(status: string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return "bg-[#fff8e1] text-[#b88300]";
  if (key === "PROCESSING") return "bg-[#e8f0ff] text-[#2f6ef4]";
  if (key === "SHIPPED") return "bg-[#e6f6ff] text-[#1d7fbf]";
  if (key === "COMPLETED") return "bg-[#eaf9ef] text-[#1f9d57]";
  if (key === "CANCELLED") return "bg-[#ffeef0] text-[#e44a59]";
  if (key.includes("REFUND")) return "bg-[#fef3c7] text-[#92400e]";
  return "bg-[#eef2f7] text-[#6b7280]";
}

function paymentMethodLabel(
  method: string | null | undefined,
  t: (key: string) => string,
) {
  if (!method) return t("ordersPage.payUnspecified");
  if (method === "bank_transfer") return "โอนผ่านธนาคาร";
  if (method === "cash_on_delivery") return "เก็บเงินปลายทาง";
  return method;
}

function formatDate(input: string, locale: "th" | "en") {
  const formatterLocale = locale === "en" ? "en-US" : "th-TH";
  return new Date(input).toLocaleDateString(formatterLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function mapStatusToDesktopTab(status: string): DesktopOrderTab {
  const key = status.toUpperCase();
  if (key === "PENDING") return "TO_PAY";
  if (key === "PROCESSING") return "TO_SHIP";
  if (key === "SHIPPED") return "TO_RECEIVE";
  if (key === "COMPLETED") return "COMPLETED";
  if (key === "CANCELLED") return "CANCELLED";
  if (key.includes("REFUND")) return "REFUND";
  return "ALL";
}

function parseDesktopOrderTab(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase() as DesktopOrderTab;
  return DESKTOP_ORDER_TABS.includes(normalized) ? normalized : null;
}

export default function OrdersPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { t, lang } = useTranslation("common");
  const locale: "th" | "en" = lang === "en" ? "en" : "th";
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [desktopActiveTab, setDesktopActiveTab] =
    useState<DesktopOrderTab>("ALL");
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [uploadingSlipId, setUploadingSlipId] = useState("");
  const [uploadError, setUploadError] = useState("");

  const desktopOrderTabs: Array<{ key: DesktopOrderTab; label: string }> = [
    { key: "ALL", label: t("ordersPage.tabAll") },
    { key: "TO_PAY", label: t("ordersPage.tabPending") },
    { key: "TO_SHIP", label: t("ordersPage.tabShipping") },
    { key: "TO_RECEIVE", label: t("ordersPage.tabReceive") },
    { key: "COMPLETED", label: t("ordersPage.tabCompleted") },
    { key: "CANCELLED", label: t("ordersPage.tabCancelled") },
    { key: "REFUND", label: t("ordersPage.tabRefund") },
  ];

  useEffect(() => {
    if (!router.isReady) return;
    const tabFromQuery = parseDesktopOrderTab(router.query.tab);
    if (tabFromQuery) {
      setDesktopActiveTab(tabFromQuery);
    }
  }, [router.isReady, router.query.tab]);

  const loadOrders = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/orders?locale=${locale}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = (await res.json()) as {
        orders?: OrderSummary[];
        error?: string;
      };
      if (!res.ok) {
        setErrorMessage(json.error ?? t("ordersPage.loadError"));
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(json.orders) ? json.orders : []);
    } finally {
      setLoading(false);
    }
  }, [locale, router, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  const filteredDesktopOrders = useMemo(() => {
    const keyword = desktopSearch.trim().toLowerCase();

    return sortedOrders.filter((order) => {
      const tab = mapStatusToDesktopTab(order.status);
      if (desktopActiveTab !== "ALL" && desktopActiveTab !== tab) {
        return false;
      }

      if (!keyword) return true;

      const orderRef = toOrderRef(order.id).toLowerCase();
      const orderLocale = order.locale === "en" ? "en" : "th";
      const productNames = order.items
        .map((item) => resolveProductName(item, locale, orderLocale).toLowerCase())
        .join(" ");

      return orderRef.includes(keyword) || productNames.includes(keyword);
    });
  }, [desktopActiveTab, desktopSearch, locale, sortedOrders]);

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      router.push("/account/settings");
      return;
    }
    goBackOrPush(router, "/account");
  };

  const confirmReceived = async (orderId: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) return;

      setOrders((prev) =>
        prev.map((item) =>
          item.id === orderId ? { ...item, status: "COMPLETED" } : item,
        ),
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleUploadSlip = async (orderId: string, file: File) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setUploadingSlipId(orderId);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("slip", file);

      const res = await fetch(`/api/orders/${orderId}/upload-slip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const json = (await res.json()) as {
        success?: boolean;
        slipUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        setUploadError(json.error ?? "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === orderId
            ? { ...item, slipUrl: json.slipUrl, status: "PROCESSING" }
            : item,
        ),
      );
    } catch (error) {
      setUploadError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploadingSlipId("");
    }
  };

  return (
    <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="md:hidden sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="flex h-[66px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <h1 className="ml-3 text-[22px] font-extrabold leading-tight tracking-tight text-black">
              {t("ordersPage.title")}
            </h1>
          </header>
        </div>
      </div>

      <div className="app-page-container md:mt-6 md:pt-7">
        <main className="pb-[120px] pt-4 md:pb-12 md:pt-0">
          {uploadError && (
            <div className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-4 py-3 text-[16px] text-[#db4f4f]">
              {uploadError}
            </div>
          )}

          {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#2f6ef4]" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-4 py-3 text-[17px] text-[#db4f4f]">
              {errorMessage}
            </div>
          ) : sortedOrders.length === 0 ? (
            <section className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center">
              <h2 className="text-[26px] font-extrabold text-[#111827]">
                ยังไม่มีคำสั่งซื้อ
              </h2>
              <p className="mt-1 text-[16px] text-[#6b7280]">
                เมื่อสั่งซื้อแล้ว รายการจะแสดงที่หน้านี้
              </p>
              <button
                type="button"
                onClick={() => router.push("/all-products")}
                className="mt-4 rounded-2xl bg-[#2f6ef4] px-6 py-2.5 text-[18px] font-semibold text-white"
              >
                ไปเลือกสินค้า
              </button>
            </section>
          ) : (
            <>
              <section className="hidden md:grid md:grid-cols-[260px_minmax(0,1fr)] md:items-start md:gap-6">
                <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-[#eef2f7] pb-5">
                    <div className="flex items-center gap-3">
                      <UserCircle2 className="h-12 w-12 text-[#94a3b8]" />
                      <div className="min-w-0">
                        <p className="truncate text-[22px] font-extrabold text-[#111827]">
                          {user?.name ?? "บัญชีของฉัน"}
                        </p>
                        <p className="truncate text-[15px] text-[#6b7280]">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <nav className="mt-4 space-y-1">
                    <button
                      type="button"
                      onClick={() => router.push("/account/settings")}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[17px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
                    >
                      บัญชีของฉัน
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center rounded-lg bg-[#fff1ef] px-3 py-2.5 text-left text-[17px] font-bold text-[#e44a59]"
                    >
                      การซื้อของฉัน
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/wishlist")}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[17px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
                    >
                      รายการโปรด
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/coupons")}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[17px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
                    >
                      โค้ดส่วนลดของฉัน
                    </button>
                  </nav>
                </aside>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
                    <div className="flex overflow-x-auto">
                      {desktopOrderTabs.map((tab) => {
                        const active = tab.key === desktopActiveTab;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setDesktopActiveTab(tab.key)}
                            className={`shrink-0 border-b-2 px-7 py-4 text-[18px] font-semibold transition ${
                              active
                                ? "border-[#e44a59] text-[#e44a59]"
                                : "border-transparent text-[#334155] hover:bg-[#f8fafc]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-[#f7f7f8] px-4 py-3">
                    <label className="flex items-center gap-3">
                      <Search className="h-6 w-6 text-[#9ca3af]" />
                      <input
                        type="search"
                        value={desktopSearch}
                        onChange={(e) => setDesktopSearch(e.target.value)}
                        placeholder="คุณสามารถค้นหาโดยใช้ชื่อผู้ขาย หมายเลขคำสั่งซื้อ หรือชื่อสินค้า"
                        className="w-full bg-transparent text-[18px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                      />
                    </label>
                  </div>

                  {filteredDesktopOrders.length === 0 ? (
                    <section className="rounded-2xl border border-[#d8d8d8] bg-white p-8 text-center">
                      <h2 className="text-[28px] font-extrabold text-[#111827]">
                        ไม่พบคำสั่งซื้อที่ตรงเงื่อนไข
                      </h2>
                      <p className="mt-1 text-[17px] text-[#6b7280]">
                        ลองเปลี่ยนแท็บสถานะหรือคำค้นหา
                      </p>
                    </section>
                  ) : (
                    <div className="space-y-4">
                      {filteredDesktopOrders.map((order) => {
                        const firstItem = order.items[0];
                        const status = order.status.toUpperCase();
                        const canTrack =
                          status === "PROCESSING" || status === "SHIPPED";
                        const canConfirm = status === "SHIPPED";
                        const needsSlip =
                          order.paymentMethod === "bank_transfer" &&
                          !order.slipUrl &&
                          status === "PENDING";
                        const image =
                          firstItem?.product?.imageUrl ||
                          "/images/placeholder.png";
                        const orderLocale = order.locale === "en" ? "en" : "th";
                        const title = firstItem
                          ? resolveProductName(firstItem, locale, orderLocale)
                          : t("ordersPage.orderLabel");
                        const totalQuantity = order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        );
                        const reorderTarget = firstItem?.product?.id ?? "";
                        const canReorder =
                          status === "COMPLETED" && reorderTarget !== "";

                        return (
                          <article
                            key={order.id}
                            className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white"
                          >
                            <div className="flex items-center justify-between gap-3 border-b border-[#f0f3f8] px-5 py-4">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#f3f4f6] text-[#ef4444]">
                                  <Store className="h-5 w-5" />
                                </span>
                                <p className="truncate text-[20px] font-bold text-[#111827]">
                                  ICN Official Shop
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-[15px] font-semibold ${statusClass(
                                  order.status,
                                )}`}
                              >
                                {statusLabel(order.status, t)}
                              </span>
                            </div>

                            <div className="grid grid-cols-[110px_minmax(0,1fr)_140px] items-start gap-4 border-b border-[#f0f3f8] px-5 py-4">
                              <div className="h-[110px] w-[110px] overflow-hidden rounded-xl border border-[#e5e7eb]">
                                <img
                                  src={image}
                                  alt={title}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div>
                                <h3 className="line-clamp-2 text-[24px] font-bold leading-tight text-[#111827]">
                                  {title}
                                </h3>
                                <p className="mt-1 text-[16px] text-[#6b7280]">
                                  {t("ordersPage.paymentMethod")}:{" "}
                                  {paymentMethodLabel(order.paymentMethod, t)}
                                </p>
                                <p className="mt-1 text-[16px] text-[#6b7280]">
                                  x{totalQuantity} •{" "}
                                  {formatDate(order.createdAt, locale)} •{" "}
                                  {toOrderRef(order.id)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-[30px] font-bold text-[#ef4444]">
                                  {toCurrency(order.totalAmount, locale)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-5 py-4">
                              <p className="text-[18px] text-[#374151]">
                                รวมการสั่งซื้อ:{" "}
                                <span className="text-[34px] font-extrabold text-[#ef4444]">
                                  {toCurrency(order.totalAmount, locale)}
                                </span>
                              </p>

                              <div className="flex items-center gap-2">
                                {needsSlip ? (
                                  <label className="flex cursor-pointer items-center justify-center rounded-lg bg-[#f97316] px-6 py-2.5 text-[17px] font-bold text-white hover:bg-[#ea580c]">
                                    <Upload className="mr-2 h-5 w-5" />
                                    {uploadingSlipId === order.id
                                      ? t("ordersPage.uploading")
                                      : t("ordersPage.uploadSlip")}
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      disabled={uploadingSlipId === order.id}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          handleUploadSlip(order.id, file);
                                      }}
                                    />
                                  </label>
                                ) : canTrack ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/orders/${order.id}/tracking`,
                                      )
                                    }
                                    className="rounded-lg bg-[#10b981] px-6 py-2.5 text-[17px] font-bold text-white"
                                  >
                                    {t("ordersPage.trackPackage")}
                                  </button>
                                ) : canReorder ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(`/products/${reorderTarget}`)
                                    }
                                    className="rounded-lg bg-[#f97316] px-6 py-2.5 text-[17px] font-bold text-white"
                                  >
                                    ซื้ออีกครั้ง
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/orders/${order.id}/tracking`,
                                      )
                                    }
                                    className="rounded-lg border border-[#2f6ef4] px-6 py-2.5 text-[17px] font-bold text-[#2f6ef4]"
                                  >
                                    {t("ordersPage.viewOrder")}
                                  </button>
                                )}

                                {canConfirm ? (
                                  <button
                                    type="button"
                                    disabled={updatingId === order.id}
                                    onClick={() => confirmReceived(order.id)}
                                    className="rounded-lg border border-[#2f6ef4] px-6 py-2.5 text-[17px] font-bold text-[#2f6ef4] disabled:opacity-60"
                                  >
                                    {updatingId === order.id
                                      ? t("ordersPage.updating")
                                      : t("ordersPage.confirmReceive")}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        status === "COMPLETED"
                                          ? "/contact"
                                          : `/orders/${order.id}/tracking`,
                                      )
                                    }
                                    className="rounded-lg border border-[#d1d5db] px-6 py-2.5 text-[17px] font-semibold text-[#374151]"
                                  >
                                    {status === "COMPLETED"
                                      ? "ติดต่อผู้ขาย"
                                      : "รายละเอียด"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3 md:hidden">
                {sortedOrders.map((order) => {
                  const firstItem = order.items[0];
                  const status = order.status.toUpperCase();
                  const canTrack =
                    status === "PROCESSING" || status === "SHIPPED";
                  const canConfirm = status === "SHIPPED";
                  const needsSlip =
                    order.paymentMethod === "bank_transfer" &&
                    !order.slipUrl &&
                    status === "PENDING";
                  const image =
                    firstItem?.product?.imageUrl || "/images/placeholder.png";
                  const orderLocale = order.locale === "en" ? "en" : "th";
                  const title = firstItem
                    ? resolveProductName(firstItem, locale, orderLocale)
                    : t("ordersPage.orderLabel");

                  return (
                    <article
                      key={order.id}
                      className="rounded-[20px] border border-[#d8d8d8] bg-white p-3 shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[#4b5563]">
                            {t("ordersPage.orderLabel")} {toOrderRef(order.id)}
                          </p>
                          <p className="mt-0.5 text-[14px] text-[#6b7280]">
                            {t("ordersPage.orderDate")}{" "}
                            {formatDate(order.createdAt, locale)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[13px] font-semibold ${statusClass(
                            order.status,
                          )}`}
                        >
                          {statusLabel(order.status, t)}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-3">
                        <div className="h-[92px] w-[92px] flex-shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb]">
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-[20px] font-bold leading-tight text-[#111827]">
                            {title}
                          </h3>
                          <p className="mt-1 text-[15px] text-[#6b7280]">
                            {order.items.length} {t("common.items")} •{" "}
                            {formatDate(order.createdAt, locale)}
                          </p>
                          <p className="mt-2 text-[26px] font-extrabold leading-none text-[#2f6ef4]">
                            {toCurrency(order.totalAmount, locale)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {needsSlip ? (
                          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#fbbf24] py-2 text-[18px] font-semibold text-white hover:bg-[#f59e0b]">
                            <Upload className="mr-2 h-5 w-5" />
                            {uploadingSlipId === order.id
                              ? t("ordersPage.uploading")
                              : t("ordersPage.uploadSlip")}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              disabled={uploadingSlipId === order.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadSlip(order.id, file);
                              }}
                            />
                          </label>
                        ) : canTrack ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/orders/${order.id}/tracking`)
                            }
                            className="flex flex-1 items-center justify-center rounded-xl bg-[#2f6ef4] py-2 text-[18px] font-semibold text-white"
                          >
                            <Truck className="mr-2 h-5 w-5" />
                            {t("ordersPage.trackPackage")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/orders/${order.id}/tracking`)
                            }
                            className="flex flex-1 items-center justify-center rounded-xl border border-[#2f6ef4] py-2 text-[18px] font-semibold text-[#2f6ef4]"
                          >
                            <Box className="mr-2 h-5 w-5" />
                            {t("ordersPage.viewOrder")}
                          </button>
                        )}

                        {canConfirm ? (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => confirmReceived(order.id)}
                            className="flex items-center justify-center rounded-xl border border-[#2f6ef4] px-4 py-2 text-[18px] font-semibold text-[#2f6ef4] disabled:opacity-60"
                          >
                            <PackageCheck className="mr-1 h-5 w-5" />
                            {updatingId === order.id
                              ? t("ordersPage.updating")
                              : t("ordersPage.received")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/orders/${order.id}/tracking`)
                            }
                            className="flex items-center justify-center rounded-xl border border-[#d0d5df] px-3 text-[#6b7280]"
                            aria-label="เปิดรายละเอียดคำสั่งซื้อ"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
