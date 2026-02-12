import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Box,
  ChevronRight,
  Loader2,
  PackageCheck,
  Truck,
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
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function toOrderRef(id: string) {
  return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
}

function statusLabel(status: string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return "รอชำระเงิน";
  if (key === "PROCESSING") return "กำลังเตรียมสินค้า";
  if (key === "SHIPPED") return "กำลังจัดส่ง";
  if (key === "COMPLETED") return "จัดส่งสำเร็จ";
  if (key === "CANCELLED") return "ยกเลิก";
  return status;
}

function statusClass(status: string) {
  const key = status.toUpperCase();
  if (key === "PENDING") return "bg-[#fff8e1] text-[#b88300]";
  if (key === "PROCESSING") return "bg-[#e8f0ff] text-[#2f6ef4]";
  if (key === "SHIPPED") return "bg-[#e6f6ff] text-[#1d7fbf]";
  if (key === "COMPLETED") return "bg-[#eaf9ef] text-[#1f9d57]";
  if (key === "CANCELLED") return "bg-[#ffeef0] text-[#e44a59]";
  return "bg-[#eef2f7] text-[#6b7280]";
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveProductName(item: OrderItem) {
  if (item.product.translations?.[0]?.name) return item.product.translations[0].name;
  if (item.product.name) return item.product.name;
  return "สินค้า";
}

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadOrders = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = (await res.json()) as { orders?: OrderSummary[]; error?: string };
      if (!res.ok) {
        setErrorMessage(json.error ?? "ไม่สามารถโหลดคำสั่งซื้อได้");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(json.orders) ? json.orders : []);
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  const handleBack = () => {
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
          item.id === orderId ? { ...item, status: "COMPLETED" } : item
        )
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
          <div className="flex h-[84px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-7 w-7" strokeWidth={2.25} />
            </button>

            <h1 className="ml-4 text-[30px] font-extrabold leading-none tracking-tight text-black">
              ประวัติคำสั่งซื้อ
            </h1>
          </div>
        </header>

        <main className="space-y-3 px-4 pb-[120px] pt-4">
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
              <h2 className="text-[26px] font-extrabold text-[#111827]">ยังไม่มีคำสั่งซื้อ</h2>
              <p className="mt-1 text-[16px] text-[#6b7280]">เมื่อสั่งซื้อแล้ว รายการจะแสดงที่หน้านี้</p>
              <button
                type="button"
                onClick={() => router.push("/all-products")}
                className="mt-4 rounded-2xl bg-[#2f6ef4] px-6 py-2.5 text-[18px] font-semibold text-white"
              >
                ไปเลือกสินค้า
              </button>
            </section>
          ) : (
            sortedOrders.map((order) => {
              const firstItem = order.items[0];
              const status = order.status.toUpperCase();
              const canTrack = status === "PROCESSING" || status === "SHIPPED";
              const canConfirm = status === "SHIPPED";
              const image = firstItem?.product?.imageUrl || "/images/placeholder.png";
              const title = firstItem ? resolveProductName(firstItem) : "คำสั่งซื้อ";

              return (
                <article
                  key={order.id}
                  className="rounded-[20px] border border-[#d8d8d8] bg-white p-3 shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] text-[#6b7280]">คำสั่งซื้อ {toOrderRef(order.id)}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[13px] font-semibold ${statusClass(
                        order.status
                      )}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-3">
                    <div className="h-[92px] w-[92px] flex-shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb]">
                      <img src={image} alt={title} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[20px] font-bold leading-tight text-[#111827]">
                        {title}
                      </h3>
                      <p className="mt-1 text-[15px] text-[#6b7280]">
                        {order.items.length} รายการ • {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-[26px] font-extrabold leading-none text-[#2f6ef4]">
                        {toCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {canTrack ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${order.id}/tracking`)}
                        className="flex flex-1 items-center justify-center rounded-xl bg-[#2f6ef4] py-2 text-[18px] font-semibold text-white"
                      >
                        <Truck className="mr-2 h-5 w-5" />
                        ติดตามพัสดุ
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${order.id}/tracking`)}
                        className="flex flex-1 items-center justify-center rounded-xl border border-[#2f6ef4] py-2 text-[18px] font-semibold text-[#2f6ef4]"
                      >
                        <Box className="mr-2 h-5 w-5" />
                        ดูคำสั่งซื้อ
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
                        {updatingId === order.id ? "กำลังอัปเดต..." : "รับแล้ว"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${order.id}/tracking`)}
                        className="flex items-center justify-center rounded-xl border border-[#d0d5df] px-3 text-[#6b7280]"
                        aria-label="เปิดรายละเอียดคำสั่งซื้อ"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
