"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import useTranslation from "next-translate/useTranslation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

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

type OrderItemPayload = {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
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

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const stripeEnabled = Boolean(stripePromise);

export default function CheckoutPaymentPage() {
  const { t, lang } = useTranslation("common");
  const { token } = useAuth();
  const router = useRouter();
  const locale: "th" | "en" = lang === "en" ? "en" : "th";

  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<AddressPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "credit_card" | "cod">("bank_transfer");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("checkout_address");
      if (!raw) {
        router.push("/checkout");
        return;
      }
      try {
        const parsed = JSON.parse(raw) as AddressPayload;
        if (!parsed?.recipient || !parsed?.line1 || !parsed?.city || !parsed?.postalCode || !parsed?.country) {
          router.push("/checkout");
          return;
        }
        setAddress(parsed);
      } catch {
        router.push("/checkout");
        return;
      }
    }

    setLoading(true);
    fetch(`/api/cart?locale=${locale}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router, locale]);

  useEffect(() => {
    if (paymentMethod === "credit_card" && !stripeEnabled) {
      setPaymentMethod("bank_transfer");
    }
  }, [paymentMethod]);

  useEffect(() => {
    let canceled = false;
    if (!address?.city) {
      setDeliveryFee(null);
      return;
    }

    setDeliveryLoading(true);
    setDeliveryError(null);

    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originProvince: process.env.NEXT_PUBLIC_WAREHOUSE_PROVINCE || "Bangkok",
        destinationProvince: address.city,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Failed to calculate");
        return r.json();
      })
      .then((data) => {
        if (canceled) return;
        setDeliveryFee(typeof data?.deliveryFee === "number" ? data.deliveryFee : 0);
      })
      .catch((err) => {
        if (canceled) return;
        setDeliveryFee(0);
        setDeliveryError(err?.message || "Error calculating delivery");
      })
      .finally(() => {
        if (!canceled) setDeliveryLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [address?.city]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unit = i.product.salePrice ?? i.product.price;
        return sum + unit * i.quantity;
      }, 0),
    [items]
  );

  const total = Math.max(subtotal - discountAmount, 0);
  const grandTotal = total + (deliveryFee ?? 0);

  const applyCoupon = async () => {
    if (!token) return;
    setCouponError(null);
    if (!couponCode.trim()) {
      setCouponError(t("checkout.couponEmpty"));
      return;
    }

    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code: couponCode.trim() }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setDiscountAmount(0);
      setCouponError(error);
      return;
    }

    const { discountValue, discountType } = await res.json();
    const calculatedDiscount =
      discountType === "percent"
        ? (subtotal * Number(discountValue || 0)) / 100
        : Number(discountValue || 0);
    setDiscountAmount(Math.max(0, Math.min(calculatedDiscount, subtotal)));
  };

  const createFormOrder = async (method: "bank_transfer" | "cod") => {
    if (!token || !address) throw new Error("Missing token or address");
    const orderItems: OrderItemPayload[] = items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      priceAtPurchase: i.product.salePrice ?? i.product.price,
    }));

    const fd = new FormData();
    fd.append("items", JSON.stringify(orderItems));
    fd.append("destinationProvince", address.city);
    fd.append("deliveryFee", String(deliveryFee ?? 0));
    Object.entries(address).forEach(([k, v]) => fd.append(k, v));
    fd.append("paymentMethod", method);
    fd.append("locale", locale);
    if (couponCode.trim()) fd.append("couponCode", couponCode.trim());
    if (method === "bank_transfer" && slipFile) {
      fd.append("slipFile", slipFile, slipFile.name);
    }

    return fetch(`/api/admin/orders?locale=${locale}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  };

  if (loading || !address) {
    return (
      <Layout title={t("checkout.title")} hideBottomNav>
        <div className="app-page-container-narrow pb-8 pt-4 md:pt-8">
          <div className="rounded-[28px] border border-[#d9e0eb] bg-white p-6 desktop-shell">
            <p>{t("checkout.loading")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t("checkout.title")} hideBottomNav>
      <div className="app-page-container-narrow pb-8 pt-4 md:pt-8">
        <div className="rounded-[28px] border border-[#d9e0eb] bg-white p-4 md:p-8 desktop-shell">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold lg:text-4xl">
              {t("checkout.paymentHeading")}
            </h1>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              {t("checkout.stepAddress")}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-xl font-semibold mb-3">{t("checkout.addressHeading")}</h2>
            <p className="text-sm text-gray-700 mb-5">
              {address.recipient} | {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              {address.line3 ? `, ${address.line3}` : ""}, {address.city} {address.postalCode}, {address.country}
            </p>

            <h2 className="text-xl font-semibold mb-4">{t("checkout.paymentHeading")}</h2>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border border-gray-300 p-3 rounded-lg text-base"
            >
              <option value="bank_transfer">{t("checkout.payBank")}</option>
              <option value="credit_card" disabled={!stripeEnabled}>
                {stripeEnabled ? t("checkout.payCard") : `${t("checkout.payCard")} (Unavailable)`}
              </option>
              <option value="cod">{t("checkout.payCod")}</option>
            </select>

            {paymentMethod === "bank_transfer" && (
              <div className="mt-4 space-y-4">
                <h3 className="text-base font-semibold">{t("checkout.uploadSlip")}</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  className="border border-gray-300 p-3 rounded-lg w-full text-base"
                />

                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      const res = await createFormOrder("bank_transfer");
                      setLoading(false);
                      if (res.ok) router.push("/success");
                      else {
                        const e = await res.json();
                        alert(t("checkout.orderError", { message: e.error }));
                      }
                    }}
                    disabled={loading}
                    className="touch-target px-6 py-3 bg-green-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {t("checkout.confirmBank")}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "credit_card" && stripePromise && (
              <div className="mt-4">
                <Elements stripe={stripePromise}>
                  <CreditCardForm
                    orderItems={items.map((i) => ({
                      productId: i.product.id,
                      quantity: i.quantity,
                      priceAtPurchase: i.product.salePrice ?? i.product.price,
                    }))}
                    address={address}
                    total={grandTotal}
                    deliveryFee={deliveryFee}
                    locale={locale}
                  />
                </Elements>
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    setLoading(true);
                    const res = await createFormOrder("cod");
                    setLoading(false);
                    if (res.ok) router.push("/success");
                    else {
                      const e = await res.json();
                      alert(t("checkout.orderError", { message: e.error }));
                    }
                  }}
                  disabled={loading}
                  className="touch-target px-6 py-3 bg-yellow-500 text-white rounded-xl disabled:opacity-50"
                >
                  {t("checkout.confirmCod")}
                </button>
              </div>
            )}
          </section>

          <aside className="h-fit lg:sticky lg:top-24 space-y-4">
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-xl font-semibold mb-4">{t("checkout.orderSummary")}</h2>
              <div className="space-y-2 text-sm">
                {items.map((i) => {
                  const unit = i.product.salePrice ?? i.product.price;
                  return (
                    <div key={i.id} className="flex justify-between">
                      <span className="truncate max-w-[70%]">{i.product.name} x {i.quantity}</span>
                      <span>THB {unit * i.quantity}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span>{t("checkout.subtotal")}</span>
                  <span>THB {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("checkout.discountLabel")}</span>
                  <span className="text-green-700">- THB {discountAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("checkout.deliveryFee")}</span>
                  <span>THB {deliveryFee ?? 0}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span>{t("checkout.grandTotal")}</span>
                  <span>THB {grandTotal}</span>
                </div>
              </div>

              {deliveryLoading ? <p className="text-sm text-gray-700 mt-3">{t("checkout.calculatingDelivery")}</p> : null}
              {deliveryError ? <p className="text-sm text-red-700 mt-3">{deliveryError}</p> : null}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-semibold mb-3">{t("checkout.couponHeading")}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("checkout.couponPlaceholder")}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 border border-gray-300 p-3 rounded-lg text-base"
                />
                <button
                  onClick={applyCoupon}
                  className="touch-target px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  {t("checkout.couponApply")}
                </button>
              </div>
              {couponError ? <p className="mt-2 text-sm text-red-600">{couponError}</p> : null}
            </section>
          </aside>
        </div>
        </div>
      </div>
    </Layout>
  );
}

type PaymentFormProps = {
  orderItems: OrderItemPayload[];
  address: AddressPayload;
  total: number;
  deliveryFee: number | null;
  locale: "th" | "en";
};

function CreditCardForm({
  orderItems,
  address,
  total,
  deliveryFee,
  locale,
}: PaymentFormProps) {
  const { t } = useTranslation("common");
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [cardholder, setCardholder] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !token) return;
    setProcessing(true);

    const { clientSecret, error: intentError } = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: Math.round(total * 100) }),
    }).then((r) => r.json());

    if (intentError) {
      alert(intentError);
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: { name: cardholder },
      },
    });

    if (error) {
      alert(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch(`/api/admin/orders?locale=${locale}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          ...address,
          destinationProvince: address.city,
          deliveryFee: deliveryFee ?? 0,
          locale,
          paymentMethod: "credit_card",
          slipUrl: null,
        }),
      });

      if (res.ok) router.push("/success");
      else {
        const err = await res.json();
        alert(t("checkout.orderError", { message: err.error }));
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder={t("checkout.cardholder")}
        value={cardholder}
        onChange={(e) => setCardholder(e.target.value)}
        className="border border-gray-300 p-3 rounded-lg w-full text-base"
        required
      />
      <div className="border border-gray-200 p-3 rounded-lg">
        <CardElement className="w-full" />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="touch-target px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
        >
          {processing ? t("checkout.processing") : t("checkout.payNow", { total })}
        </button>
      </div>
    </form>
  );
}
