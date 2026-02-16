import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Check,
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

type PaymentMethod = "bank_transfer" | "cod";
type ShippingMethod = "standard" | "express";
type MethodsResponse = {
  preferredMethod?: PaymentMethod;
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toCurrency(value: number, locale: "th" | "en" = "th") {
  const formatterLocale = locale === "en" ? "en-US" : "th-TH";
  return `฿${value.toLocaleString(formatterLocale)}`;
}

function getDisplayPrice(item: CartItem) {
  const sale = item.product.salePrice;
  if (typeof sale === "number" && sale < item.product.price) return sale;
  return item.product.price;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t, lang } = useTranslation("common");
  const { token } = useAuth();
  const locale = lang === "en" ? "en" : "th";

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressIdState] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [bankSlipFile, setBankSlipFile] = useState<File | null>(null);
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
      const [cartRes, addressesRes, profileRes, methodsRes] = await Promise.all(
        [
          fetch(`/api/cart?locale=${locale}`, {
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
        ],
      );

      const cartJson = cartRes.ok
        ? ((await cartRes.json()) as { items?: CartItem[] })
        : { items: [] };
      const addressesJson = addressesRes.ok
        ? ((await addressesRes.json()) as { addresses?: AddressItem[] })
        : { addresses: [] };
      const profileJson = profileRes.ok
        ? ((await profileRes.json()) as ProfileResponse)
        : {};
      const methodsJson = methodsRes.ok
        ? ((await methodsRes.json()) as MethodsResponse)
        : {};

      const nextItems = cartJson.items ?? [];
      const nextAddresses = addressesJson.addresses ?? [];

      setItems(nextItems);
      setAddresses(nextAddresses);
      setContactEmail(profileJson.user?.email ?? "");
      if (
        methodsJson.preferredMethod === "bank_transfer" ||
        methodsJson.preferredMethod === "cod"
      ) {
        setPaymentMethod(methodsJson.preferredMethod);
      }

      if (nextAddresses.length > 0) {
        const defaultId = getDefaultAddressId();
        const selectedId = getCheckoutSelectedAddressId();

        const nextDefaultId = nextAddresses.some(
          (item) => item.id === defaultId,
        )
          ? defaultId
          : nextAddresses[0].id;
        setDefaultAddressId(nextDefaultId);

        const nextSelectedId = nextAddresses.some(
          (item) => item.id === selectedId,
        )
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
  }, [locale, router, token]);

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
        const originProvince =
          process.env.NEXT_PUBLIC_WAREHOUSE_PROVINCE || "Bangkok";
        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originProvince,
            destinationProvince: selectedAddress.city,
          }),
        });
        const data = (await res.json()) as {
          deliveryFee?: number;
          error?: string;
        };
        if (!res.ok) {
          if (cancelled) return;
          setDeliveryBaseFee(null);
          setDeliveryError(data.error ?? t("checkout.cannotCalcDelivery"));
          return;
        }

        if (!cancelled) {
          setDeliveryBaseFee(
            typeof data.deliveryFee === "number" ? data.deliveryFee : 0,
          );
        }
      } catch {
        if (!cancelled) {
          setDeliveryBaseFee(null);
          setDeliveryError(t("checkout.cannotCalcDelivery"));
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
      setCouponError(t("checkout.couponEmpty"));
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

    const json = (await res.json()) as {
      error?: string;
      discountValue?: number;
    };
    if (!res.ok) {
      setDiscountAmount(0);
      setCouponError(json.error ?? t("checkout.couponFailed"));
      return;
    }

    setDiscountAmount(Math.max(0, Number(json.discountValue ?? 0)));
  };

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (items.length === 0) {
      setOrderError(t("checkout.noCartItems"));
      return;
    }

    if (!selectedAddress) {
      setOrderError(t("checkout.selectAddress"));
      return;
    }

    if (deliveryLoading) {
      setOrderError(t("checkout.calcWait"));
      return;
    }

    if (paymentMethod === "bank_transfer" && !bankSlipFile) {
      setOrderError(t("checkout.attachSlip"));
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

      const formData = new FormData();
      formData.append("items", JSON.stringify(orderItems));
      formData.append("recipient", selectedAddress.recipient);
      formData.append("line1", selectedAddress.line1);
      formData.append("line2", selectedAddress.line2 ?? "");
      formData.append("line3", "");
      formData.append("city", selectedAddress.city);
      formData.append("postalCode", selectedAddress.postalCode);
      formData.append(
        "country",
        selectedAddress.country || t("checkout.defaultCountry"),
      );
      formData.append("destinationProvince", selectedAddress.city);
      formData.append("deliveryFee", String(deliveryFee));
      formData.append("paymentMethod", paymentMethod);
      formData.append("locale", locale);
      if (couponCode.trim()) {
        formData.append("couponCode", couponCode.trim());
      }
      if (paymentMethod === "bank_transfer" && bankSlipFile) {
        formData.append("slipFile", bankSlipFile, bankSlipFile.name);
      }

      const res = await fetch(`/api/admin/orders?locale=${locale}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const json = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setOrderError(json.error ?? t("checkout.orderFailed"));
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

      const orderId = json.id;
      const query = new URLSearchParams({
        orderId: orderId || "",
        paymentMethod,
        totalAmount: grandTotal.toString(),
      }).toString();
      router.push(`/success?${query}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen desktop-page bg-[#f3f3f4] text-[#111827]">
      {/* Mobile Header - Mobile Only */}
      <div className="md:hidden sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="flex h-[82px] items-center px-4">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
            </button>
            <h1 className="ml-4 text-[30px] font-extrabold leading-none tracking-tight text-black">
              {t("checkout.title")}
            </h1>
          </header>
        </div>
      </div>

      {/* Desktop & Mobile Content */}
      <div className="app-page-container-narrow md:mt-8 md:pt-6 desktop-shell">
        {/* Desktop Header - Desktop Only */}
        <div className="hidden md:block mb-6">
          <h1 className="text-[32px] font-extrabold text-black">
            {t("checkout.title")}
          </h1>
        </div>

        <main className="space-y-4 md:space-y-5 pb-[195px] md:pb-12 pt-4 md:pt-0">
          {loading ? (
            <section className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[17px] text-[#6b7280]">
              {t("checkout.loading")}
            </section>
          ) : (
            <>
              <section className="rounded-2xl bg-[#dce4f7] p-3">
                <div className="mb-1 flex items-center">
                  <MapPin className="h-6 w-6 text-[#2f6ef4]" />
                  <h2 className="ml-2 text-[20px] font-bold text-[#1f2937]">
                    {t("checkout.addressHeading")}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/account/addresses/select?from=checkout")
                    }
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label={t("checkout.editAddress")}
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
                    <p className="mt-0.5 break-words">
                      {composeAddressSummary(selectedAddress)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/account/addresses/new?from=checkout")
                    }
                    className="rounded-xl border border-[#2f6ef4] bg-white px-4 py-2 text-[17px] font-semibold text-[#2f6ef4]"
                  >
                    {t("checkout.addAddress")}
                  </button>
                )}
              </section>

              <section className="rounded-2xl bg-[#dce4f7] p-3">
                <div className="mb-1 flex items-center">
                  <Phone className="h-6 w-6 text-[#2f6ef4]" />
                  <h2 className="ml-2 text-[20px] font-bold text-[#1f2937]">
                    {t("checkout.contactInfo")}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/account/addresses/select?from=checkout")
                    }
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label={t("checkout.editContactInfo")}
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
                  {t("checkout.itemsCount", { count: items.length })}
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
                            src={
                              item.product.imageUrl || "/images/placeholder.png"
                            }
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 break-words text-[18px] font-bold leading-tight text-[#232323]">
                            {item.product.name}
                          </h3>
                          <p className="text-[16px] text-[#6b7280]">
                            {t("checkout.qtyPieces", { qty: item.quantity })}
                          </p>
                          <p className="text-[26px] font-extrabold leading-none text-[#2f6ef4]">
                            {toCurrency(unitPrice * item.quantity, locale)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-[26px] font-extrabold text-[#1f2937]">
                  {t("checkout.shippingMethod")}
                </h2>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("standard")}
                    className={`flex w-full items-center rounded-2xl border px-3 py-3 ${shippingMethod === "standard"
                        ? "border-[#2f6ef4] bg-white"
                        : "border-[#d5d7dd] bg-white"
                      }`}
                  >
                    <span
                      className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full border ${shippingMethod === "standard"
                          ? "border-[#2f6ef4] bg-[#2f6ef4] text-white"
                          : "border-[#d1d5db] text-transparent"
                        }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>

                    <Truck className="mr-2 h-6 w-6 text-[#22c55e]" />
                    <div className="text-left">
                      <p className="text-[18px] font-semibold text-[#1f2937]">
                        {t("checkout.standardShipping")}
                      </p>
                      <p className="text-[18px] text-[#6b7280]">
                        {t("checkout.standardDays")}
                      </p>
                    </div>
                    <span className="ml-auto text-[18px] font-bold text-[#22b35f]">
                      {deliveryLoading
                        ? "..."
                        : deliveryBaseFee === null
                          ? "-"
                          : deliveryBaseFee === 0
                            ? "ฟรี"
                            : toCurrency(deliveryBaseFee, locale)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingMethod("express")}
                    className={`flex w-full items-center rounded-2xl border px-3 py-3 ${shippingMethod === "express"
                        ? "border-[#2f6ef4] bg-white"
                        : "border-[#d5d7dd] bg-white"
                      }`}
                  >
                    <span
                      className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full border ${shippingMethod === "express"
                          ? "border-[#2f6ef4] bg-[#2f6ef4] text-white"
                          : "border-[#d1d5db] text-transparent"
                        }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>

                    <Truck className="mr-2 h-6 w-6 text-[#22c55e]" />
                    <div className="text-left">
                      <p className="text-[18px] font-semibold text-[#1f2937]">
                        {t("checkout.expressShipping")}
                      </p>
                      <p className="text-[18px] text-[#6b7280]">
                        {t("checkout.expressDays")}
                      </p>
                    </div>
                    <span className="ml-auto text-[18px] font-bold text-[#1f2937]">
                      {deliveryLoading
                        ? "..."
                        : deliveryBaseFee === null
                          ? "-"
                          : toCurrency(deliveryBaseFee + 50, locale)}
                    </span>
                  </button>
                </div>
                {deliveryError ? (
                  <p className="mt-2 text-[17px] text-[#db4f4f]">
                    {deliveryError}
                  </p>
                ) : null}
              </section>

              <section>
                <div className="mb-2 flex items-center">
                  <h2 className="text-[26px] font-extrabold text-[#1f2937]">
                    {t("checkout.paymentMethod")}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/account/settings/payment?from=checkout")
                    }
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1f66ea] text-white"
                    aria-label={t("checkout.editPayment")}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("bank_transfer");
                      setOrderError("");
                    }}
                    className={`rounded-full px-4 py-2 text-[16px] font-semibold ${paymentMethod === "bank_transfer"
                        ? "bg-[#dce4ff] text-[#2f6ef4]"
                        : "bg-[#e5e7eb] text-[#1f2937]"
                      }`}
                  >
                    {t("checkout.payBank")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cod");
                      setOrderError("");
                    }}
                    className={`rounded-full px-4 py-2 text-[16px] font-semibold ${paymentMethod === "cod"
                        ? "bg-[#dce4ff] text-[#2f6ef4]"
                        : "bg-[#e5e7eb] text-[#1f2937]"
                      }`}
                  >
                    <Wallet className="mr-1 inline h-4 w-4" />
                    {t("checkout.payCod")}
                  </button>
                </div>

                {paymentMethod === "bank_transfer" ? (
                  <div className="mt-3 space-y-3">
                    {/* QR Code Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
                        💳 สแกน QR Code เพื่อชำระเงิน
                      </h3>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        {/* QR Code Image */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                            <img
                              src="/images/qr-promptpay.png"
                              alt="PromptPay QR Code"
                              className="w-48 h-48 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.qr-placeholder')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'qr-placeholder w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm text-center p-4';
                                  placeholder.innerHTML = 'วาง QR Code ของคุณที่<br/>/public/images/qr-promptpay.png';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Bank Account Details */}
                        <div className="space-y-2 text-center border-t border-gray-200 pt-4">
                          <p className="text-sm text-gray-600">ชื่อบัญชี</p>
                          <p className="text-base font-bold text-gray-800">ICN FREEZE</p>
                          <p className="text-sm text-gray-600 mt-2">พร้อมเพย์</p>
                          <p className="text-base font-semibold text-blue-600">0XX-XXX-XXXX</p>
                          <p className="text-lg font-bold text-green-600 mt-3">
                            ยอดชำระ: ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 text-center">
                            ⚠️ กรุณาโอนเงินตามยอดที่ระบุ และอัปโหลดสลิปด้านล่าง
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slip Upload Section */}
                    <div className="rounded-xl border border-[#d7dbe5] bg-white p-3">
                      <label className="mb-1 block text-[16px] font-semibold text-[#1f2937]">
                        {t("checkout.attachSlipLabel")}
                        <span className="ml-2 text-sm font-normal text-gray-500">(บังคับ)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setBankSlipFile(file);
                          setOrderError("");
                        }}
                        className="w-full rounded-lg border border-[#cfd5e3] bg-[#f8fafc] px-3 py-2 text-[14px] text-[#1f2937]"
                      />
                      <p className="mt-1 text-[13px] text-[#6b7280]">
                        {bankSlipFile
                          ? `✓ ไฟล์ที่เลือก: ${bankSlipFile.name}`
                          : t("checkout.slipRequired")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t("checkout.couponPlaceholder")}
                    className="h-11 flex-1 rounded-lg border border-[#9098a7] bg-[#f4f4f4] px-3 text-[16px] text-[#1f2937] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="h-11 rounded-lg border border-[#2f6ef4] px-4 text-[16px] font-semibold text-[#2f6ef4]"
                  >
                    {t("checkout.useCoupon")}
                  </button>
                </div>
                {couponError ? (
                  <p className="mt-1 text-[17px] text-[#db4f4f]">
                    {couponError}
                  </p>
                ) : null}
              </section>

              {orderError ? (
                <section className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[18px] text-[#db4f4f]">
                  {orderError}
                </section>
              ) : null}

              <section className="hidden md:block rounded-2xl border border-[#d8d8d8] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
                    <span>{t("checkout.productPrice")}</span>
                    <span>{toCurrency(subtotal, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
                    <span>{t("checkout.deliveryFee")}</span>
                    <span
                      className={
                        selectedAddress && deliveryFee === 0
                          ? "font-semibold text-[#22b35f]"
                          : ""
                      }
                    >
                      {!selectedAddress
                        ? "-"
                        : deliveryFee === 0
                          ? "ฟรี"
                          : toCurrency(deliveryFee, locale)}
                    </span>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
                      <span>{t("checkout.discountLabel")}</span>
                      <span className="font-semibold text-[#2f6ef4]">
                        - {toCurrency(discountAmount, locale)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[24px] font-extrabold text-[#1f2937]">
                      {t("checkout.grandTotal")}
                    </span>
                    <span className="text-[30px] font-extrabold leading-none text-[#2f6ef4]">
                      {toCurrency(grandTotal, locale)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    loading ||
                    placingOrder ||
                    !selectedAddress ||
                    items.length === 0
                  }
                  onClick={handlePlaceOrder}
                  className="mt-3 w-full rounded-2xl bg-[#2f6ef4] py-3 text-[22px] font-semibold leading-none text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder
                    ? t("checkout.payProcessing")
                    : t("checkout.title")}
                </button>
              </section>
            </>
          )}
        </main>
      </div>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#d8d8d8] bg-white shadow-[0_-4px_14px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <div className="mx-auto w-full max-w-[440px] px-4 pb-1 pt-2">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
              <span>{t("checkout.productPrice")}</span>
              <span>{toCurrency(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
              <span>{t("checkout.deliveryFee")}</span>
              <span
                className={
                  selectedAddress && deliveryFee === 0
                    ? "font-semibold text-[#22b35f]"
                    : ""
                }
              >
                {!selectedAddress
                  ? "-"
                  : deliveryFee === 0
                    ? "ฟรี"
                    : toCurrency(deliveryFee, locale)}
              </span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between text-[16px] text-[#6b7280]">
                <span>{t("checkout.discountLabel")}</span>
                <span className="font-semibold text-[#2f6ef4]">
                  - {toCurrency(discountAmount, locale)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[24px] font-extrabold text-[#1f2937]">
                {t("checkout.grandTotal")}
              </span>
              <span className="text-[30px] font-extrabold leading-none text-[#2f6ef4]">
                {toCurrency(grandTotal, locale)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={
              loading || placingOrder || !selectedAddress || items.length === 0
            }
            onClick={handlePlaceOrder}
            className="mt-2 w-full rounded-2xl bg-[#2f6ef4] py-2.5 text-[24px] font-semibold leading-none text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? t("checkout.payProcessing") : t("checkout.title")}
          </button>
        </div>
      </div>
    </div>
  );
}
