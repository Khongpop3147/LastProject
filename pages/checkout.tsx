// pages/checkout.tsx
"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProvinceSelect from "@/components/ProvinceSelect";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import useTranslation from "next-translate/useTranslation";

// Types
interface CartItem {
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
}

type OrderItemPayload = {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
};

type AddressPayload = {
  recipient: string;
  line1: string;
  line2: string;
  line3: string; // เพิ่ม field line3
  city: string;
  postalCode: string;
  country: string;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const { t } = useTranslation("common");
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState<AddressPayload>({
    recipient: "",
    line1: "",
    line2: "",
    line3: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "credit_card" | "cod"
  >("bank_transfer");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // coupon
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    fetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, router]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (newQty < 1) {
      alert(t("checkout.qtyMin"));
      return;
    }
    if (newQty > item.product.stock) {
      alert(t("checkout.qtyMax", { stock: item.product.stock }));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
    await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: newQty }),
    });
  };

  const subtotal = items.reduce((sum, i) => {
    const unit = i.product.salePrice ?? i.product.price;
    return sum + unit * i.quantity;
  }, 0);
  const total = Math.max(subtotal - discountAmount, 0);

  const applyCoupon = async () => {
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
    } else {
      const { discountValue } = await res.json();
      setDiscountAmount(discountValue);
    }
  };

  const createFormOrder = async (method: string) => {
    const orderItems: OrderItemPayload[] = items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      priceAtPurchase: i.product.salePrice ?? i.product.price,
    }));
    const fd = new FormData();
    fd.append("items", JSON.stringify(orderItems));
    Object.entries(address).forEach(([k, v]) => fd.append(k, v));
    fd.append("paymentMethod", method);
    if (couponCode.trim()) fd.append("couponCode", couponCode.trim());
    if (method === "bank_transfer" && slipFile) {
      fd.append("slipFile", slipFile, slipFile.name);
    }
    return fetch("/api/admin/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  };

  if (loading) return <p>{t("checkout.loading")}</p>;

  return (
    <Layout title={t("checkout.title")}>
      <h1 className="text-3xl font-bold mb-6">{t("checkout.heading")}</h1>

      {/* Cart items */}
      <div className="space-y-4 mb-6">
        {items.map((i) => {
          const unit = i.product.salePrice ?? i.product.price;
          return (
            <div key={i.id} className="flex items-center border p-4 rounded">
              <img
                src={i.product.imageUrl || "/images/placeholder.png"}
                alt={i.product.name}
                className="w-16 h-16 object-cover rounded mr-4"
              />
              <div className="flex-1">
                <p className="font-medium">{i.product.name}</p>
                <p className="text-gray-600">
                  {unit} ฿ × {i.quantity}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateQuantity(i.id, i.quantity - 1)}
                    className="px-2 py-1 border rounded"
                  >
                    –
                  </button>
                  <span>{i.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i.id, i.quantity + 1)}
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="font-semibold">{unit * i.quantity} ฿</div>
            </div>
          );
        })}
        <div className="text-right text-xl font-bold">
          {t("checkout.subtotal")}: {subtotal} ฿
        </div>
      </div>

      {/* Coupon */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {t("checkout.couponHeading")}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("checkout.couponPlaceholder")}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 border p-2 rounded"
          />
          <button
            onClick={applyCoupon}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            {t("checkout.couponApply")}
          </button>
        </div>
        {couponError && <p className="mt-1 text-red-600">{couponError}</p>}
        {discountAmount > 0 && (
          <div className="mt-1">
            <span className="line-through text-gray-500 mr-2">
              {subtotal} ฿
            </span>
            <span className="text-green-700 font-bold">
              {t("checkout.totalAfter", { total })}
            </span>
          </div>
        )}
      </div>

      {/* Address */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">
          {t("checkout.addressHeading")}
        </h2>
        <input
          type="text"
          placeholder={t("checkout.recipient")}
          value={address.recipient}
          onChange={(e) =>
            setAddress({ ...address, recipient: e.target.value })
          }
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("checkout.line1")}
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("checkout.line2")}
          value={address.line2}
          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("checkout.line3")}
          value={address.line3}
          onChange={(e) => setAddress({ ...address, line3: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <div className="flex gap-2">
          <ProvinceSelect
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
          <input
            type="text"
            placeholder={t("checkout.postalCode")}
            value={address.postalCode}
            onChange={(e) =>
              setAddress({ ...address, postalCode: e.target.value })
            }
            className="w-32 border p-2 rounded"
          />
        </div>
        <input
          type="text"
          placeholder={t("checkout.country")}
          value={address.country}
          onChange={(e) => setAddress({ ...address, country: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Payment method */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">
          {t("checkout.paymentHeading")}
        </h2>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as any)}
          className="w-full border p-2 rounded"
        >
          <option value="bank_transfer">{t("checkout.payBank")}</option>
          <option value="credit_card">{t("checkout.payCard")}</option>
          <option value="cod">{t("checkout.payCod")}</option>
        </select>

        {/* Bank transfer */}
        {paymentMethod === "bank_transfer" && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {t("checkout.uploadSlip")}
            </h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
              className="border p-2 rounded w-full"
            />
            <div className="flex justify-center mt-4">
              <img
                src="/images/1.png"
                alt="QR Code"
                className="w-56 h-56 object-contain"
              />
            </div>
            <div className="flex justify-end mt-4">
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
                className="px-6 py-3 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {t("checkout.confirmBank")}
              </button>
            </div>
          </div>
        )}

        {/* Credit card */}
        {paymentMethod === "credit_card" && (
          <Elements stripe={stripePromise}>
            <CreditCardForm
              orderItems={items.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
                priceAtPurchase: i.product.salePrice ?? i.product.price,
              }))}
              address={address}
              total={total}
            />
          </Elements>
        )}

        {/* Cash on delivery */}
        {paymentMethod === "cod" && (
          <div className="flex justify-end">
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
              className="px-6 py-3 bg-yellow-500 text-white rounded disabled:opacity-50"
            >
              {t("checkout.confirmCod")}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

// CreditCardForm component below (same pattern with t("…") for all text)
type PaymentFormProps = {
  orderItems: OrderItemPayload[];
  address: AddressPayload;
  total: number;
};

function CreditCardForm({ orderItems, address, total }: PaymentFormProps) {
  const { t } = useTranslation("common");
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [cardholder, setCardholder] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { clientSecret, error: intentError } = await fetch(
      "/api/payments/create-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: total * 100 }),
      }
    ).then((r) => r.json());

    if (intentError) {
      alert(intentError);
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: cardholder },
        },
      }
    );

    if (error) {
      alert(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          ...address,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          placeholder={t("checkout.cardholder")}
          value={cardholder}
          onChange={(e) => setCardholder(e.target.value)}
          className="border p-2 rounded w-full mb-3"
          required
        />
        <CardElement className="border p-2 rounded w-full" />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {processing
            ? t("checkout.processing")
            : t("checkout.payNow", { total })}
        </button>
      </div>
    </form>
  );
}
