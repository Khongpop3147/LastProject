import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Pencil,
  Phone,
  Truck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getCheckoutSelectedAddressId,
  getDefaultAddressId,
  setCheckoutSelectedAddressId,
  setDefaultAddressId,
} from "@/lib/addressStorage";
import { composeAddressSummary, parseAddressLine2 } from "@/lib/addressLine2";
import { goBackOrPush } from "@/lib/navigation";

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

type AddressItem = {
  id: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

type ProfileResponse = {
  user?: {
    email?: string;
  };
};

type PaymentMethod = "credit_card" | "bank_transfer" | "cod";
type ShippingMethod = "standard" | "express";
type MethodsResponse = {
  preferredMethod?: PaymentMethod;
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function getDisplayPrice(item: CartItem) {
  const sale = item.product.salePrice;
  if (typeof sale === "number" && sale < item.product.price) return sale;
  return item.product.price;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressIdState] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [deliveryBaseFee, setDeliveryBaseFee] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [orderError, setOrderError] = useState("");

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const line2Meta = useMemo(
    () => parseAddressLine2(selectedAddress?.line2),
    [selectedAddress?.line2],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + getDisplayPrice(item) * item.quantity;
      }, 0),
    [items],
  );

  const deliveryFee = useMemo(() => {
    const base = deliveryBaseFee ?? 0;
    return shippingMethod === "express" ? base + 50 : base;
  }, [deliveryBaseFee, shippingMethod]);

  const totalAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const grandTotal = totalAfterDiscount + deliveryFee;

  const loadPageData = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [cartRes, addressesRes, profileRes, methodsRes] = await Promise.all([
        fetch("/api/cart?locale=th", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/addresses", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/payments/methods", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const cartJson = cartRes.ok
        ? ((await cartRes.json()) as { items?: CartItem[] })
        : { items: [] };
      const addressesJson = addressesRes.ok
        ? ((await addressesRes.json()) as { items?: AddressItem[] })
        : { items: [] };
      const profileJson = profileRes.ok
        ? ((await profileRes.json()) as ProfileResponse)
        : {};
      const methodsJson = methodsRes.ok
        ? ((await methodsRes.json()) as MethodsResponse)
        : {};

      const nextItems = cartJson.items ?? [];
      const nextAddresses = addressesJson.items ?? [];

      setItems(nextItems);
      setAddresses(nextAddresses);
      setContactEmail(profileJson.user?.email ?? "");
      if (
        methodsJson.preferredMethod === "credit_card" ||
        methodsJson.preferredMethod === "bank_transfer" ||
        methodsJson.preferredMethod === "cod"
      ) {
        setPaymentMethod(methodsJson.preferredMethod);
      }

      if (nextAddresses.length > 0) {
        const defaultId = getDefaultAddressId();
        const selectedId = getCheckoutSelectedAddressId();

        const nextDefaultId = nextAddresses.some((item) => item.id === defaultId)
          ? defaultId
          : nextAddresses[0].id;
        setDefaultAddressId(nextDefaultId);

        const nextSelectedId = nextAddresses.some((item) => item.id === selectedId)
          ? selectedId
          : nextDefaultId;
        setCheckoutSelectedAddressId(nextSelectedId);
        setSelectedAddressIdState(nextSelectedId);
      } else {
        setSelectedAddressIdState("");
      }
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!selectedAddress?.city) {
      setDeliveryBaseFee(null);
      setDeliveryError("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setDeliveryLoading(true);
      setDeliveryError("");
      try {
        const originProvince = process.env.NEXT_PUBLIC_WAREHOUSE_PROVINCE || "Bangkok";
        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originProvince,
            destinationProvince: selectedAddress.city,
          }),
        });
        const data = (await res.json()) as { deliveryFee?: number; error?: string };
        if (!res.ok) {
          if (cancelled) return;
          setDeliveryBaseFee(null);
          setDeliveryError(data.error ?? "ไม่สามารถคำนวณค่าจัดส่งได้");
          return;
        }

        if (!cancelled) {
          setDeliveryBaseFee(typeof data.deliveryFee === "number" ? data.deliveryFee : 0);
        }
      } catch {
        if (!cancelled) {
          setDeliveryBaseFee(null);
          setDeliveryError("ไม่สามารถคำนวณค่าจัดส่งได้");
        }
      } finally {
        if (!cancelled) setDeliveryLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedAddress?.city]);

  const handleBack = () => {
    goBackOrPush(router, "/cart");
  };

  const handleApplyCoupon = async () => {
    setCouponError("");
    setOrderError("");

    const code = couponCode.trim();
    if (!code) {
      setCouponError("กรุณากรอกรหัสคูปอง");
      return;
    }

    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ code }),
    });

    const json = (await res.json()) as { error?: string; discountValue?: number };
    if (!res.ok) {
      setDiscountAmount(0);
      setCouponError(json.error ?? "ใช้คูปองไม่สำเร็จ");
      return;
    }

    setDiscountAmount(Math.max(0, Number(json.discountValue ?? 0)));
  };

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (items.length === 0) {
      setOrderError("ไม่มีสินค้าในตะกร้า");
      return;
    }

    if (!selectedAddress) {
      setOrderError("กรุณาเลือกที่อยู่จัดส่ง");
      return;
    }

    if (deliveryLoading) {
      setOrderError("กำลังคำนวณค่าจัดส่ง กรุณารอสักครู่");
      return;
    }

    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        priceAtPurchase: getDisplayPrice(item),
      }));

      const payload = {
        items: JSON.stringify(orderItems),
        recipient: selectedAddress.recipient,
        line1: selectedAddress.line1,
        line2: selectedAddress.line2 ?? "",
        line3: "",
        city: selectedAddress.city,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country || "ไทย",
        destinationProvince: selectedAddress.city,
        deliveryFee,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setOrderError(json.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
        return;
      }

      await Promise.all(
        items.map((item) =>
          fetch("/api/cart", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ itemId: item.id }),
          }),
        ),
      );

      router.push("/success");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
          <div className="flex h-[82px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
            </button>
            <h1 className="ml-4 text-[30px] font-extrabold leading-none tracking-tight text-black">
              ชำระเงิน
            </h1>
          </div>
        </header>

        <main className="space-y-4 px-4 pb-[195px] pt-4">
          {loading ? (
            <section className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[17px] text-[#6b7280]">
              กำลังโหลดข้อมูล...
            </section>
          ) : (
            <>
              <section className="rounded-2xl bg-[#dce4f7] p-3">
                <div className="mb-1 flex items-center">
                  <MapPin className="h-6 w-6 text-[#2f6ef4]" />
                  <h2 className="ml-2 text-[20px] font-bold text-[#1f2937]">ที่อยู่จัดส่ง</h2>
                  <button
                    type="button"
                    onClick={() => router.push("/account/addresses?from=checkout")}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label="แก้ไขที่อยู่"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>

                {selectedAddress ? (
                  <div className="text-[17px] leading-tight text-[#232c3a]">
                    <p className="font-semibold break-words">
                      {selectedAddress.recipient}
                      {line2Meta.phone ? ` ${line2Meta.phone}` : ""}
                    </p>
                    <p className="mt-0.5 break-words">{composeAddressSummary(selectedAddress)}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/account/addresses/new?from=checkout")}
                    className="rounded-xl border border-[#2f6ef4] bg-white px-4 py-2 text-[17px] font-semibold text-[#2f6ef4]"
                  >
                    เพิ่มที่อยู่จัดส่ง
                  </button>
                )}
              </section>

              <section className="rounded-2xl bg-[#dce4f7] p-3">
                <div className="mb-1 flex items-center">
                  <Phone className="h-6 w-6 text-[#2f6ef4]" />
                  <h2 className="ml-2 text-[20px] font-bold text-[#1f2937]">ข้อมูลติดต่อ</h2>
                  <button
                    type="button"
                    onClick={() => router.push("/account/addresses?from=checkout")}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label="แก้ไขข้อมูลติดต่อ"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-[17px] leading-tight text-[#232c3a] break-all">
                  {line2Meta.phone || "-"}
                  <br />
                  {contactEmail || "-"}
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-[26px] font-extrabold text-[#1f2937]">
                  สินค้า ({items.length} รายการ)
                </h2>

                <div className="space-y-3">
                  {items.map((item) => {
                    const unitPrice = getDisplayPrice(item);
                    return (
                      <article
                        key={item.id}
                        className="flex items-start gap-3 rounded-2xl border border-[#d8d8d8] bg-white p-3 shadow-[0_2px_5px_rgba(0,0,0,0.08)]"
                      >
                        <div className="h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={item.product.imageUrl || "/images/placeholder.png"}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 break-words text-[18px] font-bold leading-tight text-[#232323]">
                            {item.product.name}
                          </h3>
                          <p className="text-[16px] text-[#6b7280]">จำนวน {item.quantity} ชิ้น</p>
                          <p className="text-[26px] font-extrabold leading-none text-[#2f6ef4]">
                            {toCurrency(unitPrice * item.quantity)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-[26px] font-extrabold text-[#1f2937]">วิธีจัดส่ง</h2>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("standard")}
                    className={`flex w-full items-center rounded-2xl border px-3 py-3 ${
                      shippingMethod === "standard"
                        ? "border-[#2f6ef4] bg-white"
                        : "border-[#d5d7dd] bg-white"
                    }`}
                  >
                    <span
                      className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full border ${
                        shippingMethod === "standard"
                          ? "border-[#2f6ef4] bg-[#2f6ef4] text-white"
                          : "border-[#d1d5db] text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>

                    <Truck className="mr-2 h-6 w-6 text-[#22c55e]" />
                    <div className="text-left">
                      <p className="text-[18px] font-semibold text-[#1f2937]">จัดส่งปกติ</p>
                      <p className="text-[18px] text-[#6b7280]">3 - 5 วัน</p>
                    </div>
                    <span className="ml-auto text-[18px] font-bold text-[#22b35f]">
                      {deliveryLoading
                        ? "..."
                        : deliveryBaseFee === null
                        ? "-"
                        : deliveryBaseFee === 0
                        ? "ฟรี"
                        : toCurrency(deliveryBaseFee)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingMethod("express")}
                    className={`flex w-full items-center rounded-2xl border px-3 py-3 ${
                      shippingMethod === "express"
                        ? "border-[#2f6ef4] bg-white"
                        : "border-[#d5d7dd] bg-white"
                    }`}
                  >
                    <span
                      className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full border ${
                        shippingMethod === "express"
                          ? "border-[#2f6ef4] bg-[#2f6ef4] text-white"
                          : "border-[#d1d5db] text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>

                    <Truck className="mr-2 h-6 w-6 text-[#22c55e]" />
                    <div className="text-left">
                      <p className="text-[18px] font-semibold text-[#1f2937]">จัดส่งด่วน</p>
                      <p className="text-[18px] text-[#6b7280]">1 - 2 วัน</p>
                    </div>
                    <span className="ml-auto text-[18px] font-bold text-[#1f2937]">
                      {deliveryLoading
                        ? "..."
                        : deliveryBaseFee === null
                        ? "-"
                        : toCurrency(deliveryBaseFee + 50)}
                    </span>
                  </button>
                </div>
                {deliveryError ? (
                  <p className="mt-2 text-[17px] text-[#db4f4f]">{deliveryError}</p>
                ) : null}
              </section>

              <section>
                <div className="mb-2 flex items-center">
                  <h2 className="text-[26px] font-extrabold text-[#1f2937]">วิธีชำระเงิน</h2>
                  <button
                    type="button"
                    onClick={() => router.push("/account/settings/payment?from=checkout")}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label="แก้ไขวิธีชำระเงิน"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit_card")}
                    className={`rounded-full px-4 py-2 text-[16px] font-semibold ${
                      paymentMethod === "credit_card"
                        ? "bg-[#dce4ff] text-[#2f6ef4]"
                        : "bg-[#e5e7eb] text-[#1f2937]"
                    }`}
                  >
                    <CreditCard className="mr-1 inline h-4 w-4" />
                    บัตรเครดิต/เดบิต
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`rounded-full px-4 py-2 text-[16px] font-semibold ${
                      paymentMethod === "bank_transfer"
                        ? "bg-[#dce4ff] text-[#2f6ef4]"
                        : "bg-[#e5e7eb] text-[#1f2937]"
                    }`}
                  >
                    โอนผ่านธนาคาร
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`rounded-full px-4 py-2 text-[16px] font-semibold ${
                      paymentMethod === "cod"
                        ? "bg-[#dce4ff] text-[#2f6ef4]"
                        : "bg-[#e5e7eb] text-[#1f2937]"
                    }`}
                  >
                    <Wallet className="mr-1 inline h-4 w-4" />
                    เก็บเงินปลายทาง
                  </button>
                </div>
              </section>

              <section>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="กรอกรหัสคูปอง"
                    className="h-11 flex-1 rounded-lg border border-[#9098a7] bg-[#f4f4f4] px-3 text-[16px] text-[#1f2937] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="h-11 rounded-lg border border-[#2f6ef4] px-4 text-[16px] font-semibold text-[#2f6ef4]"
                  >
                    ใช้คูปอง
                  </button>
                </div>
                {couponError ? (
                  <p className="mt-1 text-[17px] text-[#db4f4f]">{couponError}</p>
                ) : null}
              </section>

              {orderError ? (
                <section className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[18px] text-[#db4f4f]">
                  {orderError}
                </section>
              ) : null}
            </>
          )}
        </main>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d8d8d8] bg-white shadow-[0_-4px_14px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <div className="mx-auto w-full max-w-[440px] px-4 pb-1 pt-2">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
              <span>ราคาสินค้า</span>
              <span>{toCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
              <span>ค่าจัดส่ง</span>
              <span
                className={
                  selectedAddress && deliveryFee === 0 ? "font-semibold text-[#22b35f]" : ""
                }
              >
                {!selectedAddress
                  ? "-"
                  : deliveryFee === 0
                  ? "ฟรี"
                  : toCurrency(deliveryFee)}
              </span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
                <span>ส่วนลด</span>
                <span className="font-semibold text-[#2f6ef4]">- {toCurrency(discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[24px] font-extrabold text-[#1f2937]">รวมทั้งหมด</span>
              <span className="text-[30px] font-extrabold leading-none text-[#2f6ef4]">
                {toCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || placingOrder || !selectedAddress || items.length === 0}
            onClick={handlePlaceOrder}
            className="mt-2 w-full rounded-2xl bg-[#2f6ef4] py-2.5 text-[24px] font-semibold leading-none text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? "กำลังชำระเงิน..." : "ชำระเงิน"}
          </button>
        </div>
      </div>
    </div>
  );
}
