// pages/orders.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import useTranslation from "next-translate/useTranslation";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { name: string; imageUrl?: string | null };
}

type OrderSummary = {
  id: string;
  totalAmount: number;
  status: string; // PENDING, PROCESSING, SHIPPED, COMPLETED, CANCELLED
  createdAt: string;
  items: OrderItem[];
};

// localization of statuses
const STATUS_TABS = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export default function OrdersPage() {
  const { t, lang } = useTranslation("common");
  const { token } = useAuth();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] =
    useState<(typeof STATUS_TABS)[number]>("pending");

  // SWR fetcher includes locale in query
  const fetcher = (url: string) =>
    fetch(`${url}?locale=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("ordersLoadError"));
        return res.json();
      })
      .then((data) => data.orders as OrderSummary[]);

  // only fetch when we have a token
  const {
    data: orders,
    error,
    mutate,
  } = useSWR(token ? "/api/orders" : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  // redirect if not logged in
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);
  if (token === null) return null;

  // loading / error states
  if (error) {
    return (
      <Layout title={t("myOrders")}>
        <div className="p-8 text-center text-red-500">
          {t("ordersLoadError")}
        </div>
      </Layout>
    );
  }
  if (!orders) {
    return (
      <Layout title={t("myOrders")}>
        <div className="p-8 text-center text-gray-500">
          {t("ordersLoading")}
        </div>
      </Layout>
    );
  }

  // filter by status
  const filteredOrders = orders.filter(
    (o) => o.status.toLowerCase() === activeStatus
  );

  // confirm received
  const confirmReceived = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error();
      mutate(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: "COMPLETED" } : o
        ),
        false
      );
    } catch {
      alert(t("ordersConfirmError"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout title={t("myOrders")}>
      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold mb-6">{t("myOrders")}</h1>

        {/* Status Tabs */}
        <div className="flex space-x-4 mb-6">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                activeStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t(`status.${status}`)}
            </button>
          ))}
        </div>

        {!filteredOrders.length ? (
          <div className="p-6 text-center text-gray-600 text-lg">
            {t("noOrdersInStatus", { status: t(`status.${activeStatus}`) })}
          </div>
        ) : (
          <ul className="space-y-6">
            {filteredOrders.map((o) => (
              <li
                key={o.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <p className="text-2xl font-semibold">
                      {t("orderNumber", { id: o.id.slice(-6) })}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(o.createdAt).toLocaleString(
                        lang === "en" ? "en-US" : "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right">
                    <p className="text-xl font-semibold">
                      {t("currency", { amount: o.totalAmount })}
                    </p>
                    <p className="text-md text-gray-500">
                      {t(`status.${o.status.toLowerCase()}`)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {it.product.imageUrl ? (
                          <img
                            src={it.product.imageUrl}
                            alt={it.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            {t("noImage")}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-medium truncate">
                          {it.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {it.quantity} ×{" "}
                          {t("currency", { amount: it.priceAtPurchase })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Confirm Received */}
                {o.status.toLowerCase() === "shipped" && (
                  <div className="text-right">
                    <button
                      onClick={() => confirmReceived(o.id)}
                      disabled={updatingId === o.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingId === o.id
                        ? t("confirming")
                        : t("confirmReceived")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
