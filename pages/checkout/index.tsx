"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import ProvinceSelect from "@/components/ProvinceSelect";
import { useAuth } from "@/context/AuthContext";
import useTranslation from "next-translate/useTranslation";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    imageUrl?: string | null;
    stock: number;
  };
};

type AddressPayload = {
  recipient: string;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  postalCode: string;
  country: string;
};

const ADDRESS_PARTS_SEPARATOR = "||";

function parseAddressLine2(line2?: string | null) {
  const raw = String(line2 || "").trim();
  if (!raw) return { subdistrict: "", district: "" };
  if (raw.includes(ADDRESS_PARTS_SEPARATOR)) {
    const [subdistrict, district] = raw.split(ADDRESS_PARTS_SEPARATOR);
    return {
      subdistrict: (subdistrict || "").trim(),
      district: (district || "").trim(),
    };
  }
  return { subdistrict: raw, district: "" };
}

export default function CheckoutAddressPage() {
  const { t, lang } = useTranslation("common");
  const { token, user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressInitialized, setAddressInitialized] = useState(false);
  const [address, setAddress] = useState<AddressPayload>({
    recipient: "",
    line1: "",
    line2: "",
    line3: "",
    city: "",
    postalCode: "",
    country: "",
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    fetch(`/api/cart?locale=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router, lang]);

  useEffect(() => {
    if (!token || addressInitialized) return;

    const preferredKey = `preferred_address:${user?.id || "guest"}`;
    const preferredDataKey = `preferred_address_data:${user?.id || "guest"}`;
    const preferredId = typeof window !== "undefined" ? localStorage.getItem(preferredKey) : null;
    const preferredData = typeof window !== "undefined" ? localStorage.getItem(preferredDataKey) : null;

    if (preferredData) {
      try {
        const parsed = JSON.parse(preferredData);
        setAddress((prev) => ({ ...prev, ...parsed }));
        setAddressInitialized(true);
        return;
      } catch {
        // ignore parse errors
      }
    }

    fetch("/api/addresses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : [];
        if (list.length) {
          const preferred = list.find((item: any) => item.id === preferredId) || list[0];
          if (preferred) {
            const parsedLine2 = parseAddressLine2(preferred.line2);
            setAddress({
              recipient: preferred.recipient || "",
              line1: preferred.line1 || "",
              line2: parsedLine2.subdistrict,
              line3: parsedLine2.district,
              city: preferred.city || "",
              postalCode: preferred.postalCode || "",
              country: preferred.country || "",
            });
            return;
          }
        }

        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("checkout_address");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setAddress((prev) => ({ ...prev, ...parsed }));
            } catch {
              // ignore parse errors
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setAddressInitialized(true));
  }, [token, user?.id, addressInitialized]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unit = i.product.salePrice ?? i.product.price;
        return sum + unit * i.quantity;
      }, 0),
    [items]
  );

  const isAddressComplete = Boolean(
    address.recipient.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.postalCode.trim() &&
      address.country.trim()
  );

  const onContinue = () => {
    if (!isAddressComplete) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("checkout_address", JSON.stringify(address));
    }
    router.push("/checkout/payment");
  };

  if (loading) {
    return (
      <Layout title={t("checkout.title")}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <p>{t("checkout.loading")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t("checkout.title")}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-6">{t("checkout.heading")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-xl font-semibold mb-4">{t("checkout.addressHeading")}</h2>
            <p className="text-sm text-gray-700 mb-4">{t("checkout.addressHelp")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t("checkout.recipient")}
                value={address.recipient}
                onChange={(e) => setAddress({ ...address, recipient: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base"
              />
              <input
                type="text"
                placeholder={t("checkout.country")}
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base"
              />
              <input
                type="text"
                placeholder={t("checkout.line1")}
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base"
              />
              <input
                type="text"
                placeholder={t("checkout.line2")}
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base"
              />
              <input
                type="text"
                placeholder={t("checkout.line3")}
                value={address.line3}
                onChange={(e) => setAddress({ ...address, line3: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base"
              />
              <ProvinceSelect
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("checkout.postalCode")}
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-base md:col-span-2"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className={`touch-target px-6 py-3 rounded-xl text-white font-semibold ${
                  isAddressComplete ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={onContinue}
                disabled={!isAddressComplete}
              >
                {t("checkout.continuePayment")}
              </button>
            </div>
          </section>

          <aside className="h-fit lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-xl font-semibold mb-4">{t("checkout.orderSummary")}</h2>
            <div className="space-y-2 text-sm">
              {items.map((i) => {
                const unit = i.product.salePrice ?? i.product.price;
                return (
                  <div key={i.id} className="flex justify-between text-gray-700">
                    <span className="truncate max-w-[70%]">{i.product.name} x {i.quantity}</span>
                    <span>THB {unit * i.quantity}</span>
                  </div>
                );
              })}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold">
                <span>{t("checkout.subtotal")}</span>
                <span>THB {subtotal}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
