import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Plus,
  ReceiptText,
  Settings,
  Trash2,
  WalletCards,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";

type MethodId = "credit_card" | "bank_transfer" | "cod";
type SettingsMethodId = "credit_card" | "bank_transfer";

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

type SavedPaymentCard = {
  id: string;
  holderName: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
  createdAt: string;
};

type CardsResponse = {
  items: SavedPaymentCard[];
};

type CardFormState = {
  holderName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
};

const METHOD_LABEL: Record<SettingsMethodId, string> = {
  credit_card: "บัตรเครดิต/เดบิต",
  bank_transfer: "โอนผ่านธนาคาร",
};

const INITIAL_CARD_FORM: CardFormState = {
  holderName: "",
  cardNumber: "",
  expMonth: "",
  expYear: "",
  cvv: "",
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

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function isValidByLuhn(cardNumber: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index] ?? "0");
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function normalizeMethod(method?: MethodId): SettingsMethodId {
  if (method === "credit_card") return "credit_card";
  return "bank_transfer";
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
  if (method === "credit_card") return "บัตรเครดิต/เดบิต";
  if (method === "bank_transfer") return "โอนผ่านธนาคาร";
  if (method === "cod") return "เก็บเงินปลายทาง";
  return method;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [savingCard, setSavingCard] = useState(false);

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [preferredMethod, setPreferredMethod] =
    useState<SettingsMethodId>("bank_transfer");
  const [historyItems, setHistoryItems] = useState<PaymentHistoryItem[]>([]);
  const [cards, setCards] = useState<SavedPaymentCard[]>([]);

  const [openMethodSheet, setOpenMethodSheet] = useState(false);
  const [openAddCardModal, setOpenAddCardModal] = useState(false);
  const [cardTarget, setCardTarget] = useState<SavedPaymentCard | null>(null);

  const [cardForm, setCardForm] = useState<CardFormState>(INITIAL_CARD_FORM);
  const [cardError, setCardError] = useState("");

  const fromCheckout = router.query.from === "checkout";

  const defaultCard = useMemo(() => {
    return cards.find((item) => item.isDefault) ?? cards[0] ?? null;
  }, [cards]);

  const loadData = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [methodsRes, historyRes, cardsRes] = await Promise.all([
        fetch("/api/payments/methods", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/payments/history?limit=20", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/payments/cards", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const methodsJson = methodsRes.ok
        ? ((await methodsRes.json()) as MethodsResponse)
        : { preferredMethod: "bank_transfer" as MethodId, methods: [] };
      const historyJson = historyRes.ok
        ? ((await historyRes.json()) as PaymentHistoryResponse)
        : { items: [] };
      const cardsJson = cardsRes.ok
        ? ((await cardsRes.json()) as CardsResponse)
        : { items: [] };

      const nextCards = cardsJson.items ?? [];
      const normalizedPreferred = normalizeMethod(methodsJson.preferredMethod);
      const nextPreferred =
        normalizedPreferred === "credit_card" && nextCards.length === 0
          ? "bank_transfer"
          : normalizedPreferred;

      setMethods(methodsJson.methods ?? []);
      setPreferredMethod(nextPreferred);
      setHistoryItems(historyJson.items ?? []);
      setCards(nextCards);
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

  const handlePickMethod = async (methodId: SettingsMethodId) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    if (methodId === "credit_card" && cards.length === 0) {
      setOpenMethodSheet(false);
      setOpenAddCardModal(true);
      return;
    }

    setSavingMethod(true);
    try {
      const res = await fetch("/api/payments/methods", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ paymentMethod: methodId }),
      });
      if (!res.ok) {
        return;
      }

      setPreferredMethod(methodId);
      setOpenMethodSheet(false);
    } finally {
      setSavingMethod(false);
    }
  };

  const createCard = async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    const holderName = cardForm.holderName.trim();
    const cardNumber = cardForm.cardNumber.replace(/\D/g, "");
    const expMonth = onlyDigits(cardForm.expMonth, 2);
    const expYear = onlyDigits(cardForm.expYear, 4);
    const cvv = onlyDigits(cardForm.cvv, 4);

    if (holderName.length < 2) {
      setCardError("กรุณากรอกชื่อเจ้าของบัตร");
      return;
    }
    if (cardNumber.length < 13 || cardNumber.length > 19 || !isValidByLuhn(cardNumber)) {
      setCardError("เลขบัตรไม่ถูกต้อง");
      return;
    }
    if (!/^\d{1,2}$/.test(expMonth)) {
      setCardError("เดือนหมดอายุไม่ถูกต้อง");
      return;
    }
    const monthNum = Number(expMonth);
    if (monthNum < 1 || monthNum > 12) {
      setCardError("เดือนหมดอายุไม่ถูกต้อง");
      return;
    }
    if (!/^\d{2,4}$/.test(expYear)) {
      setCardError("ปีหมดอายุไม่ถูกต้อง");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      setCardError("CVV ไม่ถูกต้อง");
      return;
    }

    setCardError("");
    setSavingCard(true);
    try {
      const res = await fetch("/api/payments/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          holderName,
          cardNumber,
          expMonth,
          expYear,
          cvv,
          makeDefault: cards.length === 0,
        }),
      });

      const json = (await res.json()) as {
        error?: string;
        items?: SavedPaymentCard[];
      };
      if (!res.ok) {
        setCardError(json.error ?? "เพิ่มบัตรไม่สำเร็จ");
        return;
      }

      setCards(json.items ?? []);
      setCardForm(INITIAL_CARD_FORM);
      setOpenAddCardModal(false);
      await handlePickMethod("credit_card");
    } finally {
      setSavingCard(false);
    }
  };

  const setDefaultCard = async (cardId: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setSavingCard(true);
    try {
      const res = await fetch(`/api/payments/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isDefault: true }),
      });
      const json = (await res.json()) as {
        items?: SavedPaymentCard[];
      };
      if (!res.ok) return;

      setCards(json.items ?? []);
      setCardTarget(null);
      if (preferredMethod !== "credit_card") {
        await handlePickMethod("credit_card");
      }
    } finally {
      setSavingCard(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setSavingCard(true);
    try {
      const res = await fetch(`/api/payments/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = (await res.json()) as {
        items?: SavedPaymentCard[];
      };
      if (!res.ok) return;

      const nextCards = json.items ?? [];
      setCards(nextCards);
      setCardTarget(null);
      if (nextCards.length === 0 && preferredMethod === "credit_card") {
        await handlePickMethod("bank_transfer");
      }
    } finally {
      setSavingCard(false);
    }
  };

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
              <section className="mb-6">
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {cards.map((card) => (
                    <article
                      key={card.id}
                      className="w-[250px] flex-shrink-0 rounded-[18px] bg-gradient-to-br from-[#557dc7] to-[#3f63a7] p-4 text-white shadow-[0_8px_16px_rgba(0,0,0,0.14)]"
                    >
                      <div className="mb-4 flex items-center">
                        <WalletCards className="h-8 w-8" />
                        <button
                          type="button"
                          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
                          onClick={() => setCardTarget(card)}
                          aria-label="จัดการบัตร"
                        >
                          <Settings className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-[20px] font-semibold tracking-wide">
                        •••• •••• •••• {card.last4}
                      </p>
                      <p className="mt-1 truncate text-[15px]">{card.holderName}</p>
                      <div className="mt-2 flex items-center justify-between text-[13px] text-white/90">
                        <span>หมดอายุ {card.expMonth}/{card.expYear}</span>
                        {card.isDefault ? (
                          <span className="rounded-full bg-white/20 px-2 py-0.5">หลัก</span>
                        ) : null}
                      </div>
                    </article>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCardError("");
                      setOpenAddCardModal(true);
                    }}
                    className="flex w-[76px] flex-shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-b from-[#2f6ef4] to-[#1d8ef2] text-white shadow-[0_8px_16px_rgba(0,0,0,0.14)]"
                    aria-label="เพิ่มบัตร"
                  >
                    <Plus className="h-8 w-8" strokeWidth={2.2} />
                  </button>
                </div>
              </section>

              <section className="mb-6 rounded-2xl border border-[#d8d8d8] bg-white p-3">
                <div className="mb-2 flex items-center">
                  <h2 className="text-[20px] font-bold text-[#1f2937]">
                    ช่องทางหลักที่เลือก
                  </h2>
                  <button
                    type="button"
                    className="ml-auto rounded-lg border border-[#2f6ef4] px-3 py-1 text-[14px] font-semibold text-[#2f6ef4]"
                    onClick={() => setOpenMethodSheet(true)}
                  >
                    เปลี่ยน
                  </button>
                </div>

                <p className="text-[17px] font-semibold text-[#1f2937]">
                  {METHOD_LABEL[preferredMethod]}
                </p>
                {preferredMethod === "credit_card" && defaultCard ? (
                  <p className="text-[14px] text-[#6b7280]">
                    บัตรลงท้าย {defaultCard.last4} ({defaultCard.holderName})
                  </p>
                ) : null}
                {preferredMethod === "bank_transfer" ? (
                  <p className="text-[14px] text-[#6b7280]">ใช้แล้ว {methods.find((m) => m.id === "bank_transfer")?.usedCount ?? 0} ครั้ง</p>
                ) : null}
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

      {openMethodSheet ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 px-4 pb-4">
          <div className="w-full max-w-[440px] rounded-[24px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <h3 className="mb-2 text-[22px] font-extrabold text-[#1f2937]">
              เลือกช่องทางชำระเงิน
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                disabled={savingMethod}
                onClick={() => handlePickMethod("credit_card")}
                className={`flex w-full items-center rounded-xl border px-3 py-2 text-left ${
                  preferredMethod === "credit_card"
                    ? "border-[#2f6ef4] bg-[#edf3ff] text-[#2f6ef4]"
                    : "border-[#d7dde9] bg-white text-[#1f2937]"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="ml-2 text-[16px] font-semibold">
                  {cards.length > 0
                    ? `บัตรเครดิต/เดบิต (ลงท้าย ${defaultCard?.last4 ?? "----"})`
                    : "บัตรเครดิต/เดบิต (เพิ่มบัตรก่อน)"}
                </span>
                {preferredMethod === "credit_card" ? (
                  <Check className="ml-auto h-5 w-5" />
                ) : null}
              </button>

              <button
                type="button"
                disabled={savingMethod}
                onClick={() => handlePickMethod("bank_transfer")}
                className={`flex w-full items-center rounded-xl border px-3 py-2 text-left ${
                  preferredMethod === "bank_transfer"
                    ? "border-[#2f6ef4] bg-[#edf3ff] text-[#2f6ef4]"
                    : "border-[#d7dde9] bg-white text-[#1f2937]"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="ml-2 text-[16px] font-semibold">โอนผ่านธนาคาร</span>
                {preferredMethod === "bank_transfer" ? (
                  <Check className="ml-auto h-5 w-5" />
                ) : null}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpenMethodSheet(false)}
              className="mt-3 w-full rounded-xl border border-[#2f6ef4] py-2 text-[16px] font-semibold text-[#2f6ef4]"
            >
              ปิด
            </button>
          </div>
        </div>
      ) : null}

      {openAddCardModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[380px] rounded-[24px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <h3 className="text-[22px] font-extrabold text-[#1f2937]">เพิ่มบัตรใหม่</h3>

            <div className="mt-3 space-y-2">
              <input
                value={cardForm.holderName}
                onChange={(e) =>
                  setCardForm((prev) => ({ ...prev, holderName: e.target.value }))
                }
                placeholder="ชื่อบนบัตร"
                className="h-11 w-full rounded-xl border border-[#d7dde9] px-3 text-[16px] outline-none focus:border-[#2f6ef4]"
              />
              <input
                value={cardForm.cardNumber}
                onChange={(e) =>
                  setCardForm((prev) => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value),
                  }))
                }
                inputMode="numeric"
                placeholder="เลขบัตร"
                className="h-11 w-full rounded-xl border border-[#d7dde9] px-3 text-[16px] outline-none focus:border-[#2f6ef4]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={cardForm.expMonth}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      expMonth: onlyDigits(e.target.value, 2),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="เดือน"
                  className="h-11 rounded-xl border border-[#d7dde9] px-3 text-[16px] outline-none focus:border-[#2f6ef4]"
                />
                <input
                  value={cardForm.expYear}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      expYear: onlyDigits(e.target.value, 4),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="ปี"
                  className="h-11 rounded-xl border border-[#d7dde9] px-3 text-[16px] outline-none focus:border-[#2f6ef4]"
                />
                <input
                  value={cardForm.cvv}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cvv: onlyDigits(e.target.value, 4),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="CVV"
                  className="h-11 rounded-xl border border-[#d7dde9] px-3 text-[16px] outline-none focus:border-[#2f6ef4]"
                />
              </div>
            </div>

            <p className="mt-2 text-[12px] text-[#6b7280]">
              ข้อมูลบัตรใช้สำหรับบันทึกวิธีชำระเงินก่อนเท่านั้น ระบบยังไม่ตัดเงินจริงอัตโนมัติ
            </p>

            {cardError ? (
              <p className="mt-2 rounded-lg border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[14px] text-[#db4f4f]">
                {cardError}
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardError("");
                  setOpenAddCardModal(false);
                }}
                className="rounded-xl border border-[#2f6ef4] py-2 text-[16px] font-semibold text-[#2f6ef4]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={savingCard}
                onClick={createCard}
                className="rounded-xl bg-[#2f6ef4] py-2 text-[16px] font-semibold text-white disabled:opacity-60"
              >
                {savingCard ? "กำลังบันทึก..." : "เพิ่มบัตร"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cardTarget ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-4 pb-4">
          <div className="w-full max-w-[380px] rounded-[24px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
            <h3 className="text-[20px] font-extrabold text-[#1f2937]">
              จัดการบัตรลงท้าย {cardTarget.last4}
            </h3>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                disabled={savingCard || cardTarget.isDefault}
                onClick={() => setDefaultCard(cardTarget.id)}
                className="flex w-full items-center rounded-xl border border-[#2f6ef4] px-3 py-2 text-[16px] font-semibold text-[#2f6ef4] disabled:opacity-50"
              >
                <Check className="mr-2 h-5 w-5" />
                {cardTarget.isDefault ? "บัตรหลัก" : "ตั้งเป็นบัตรหลัก"}
              </button>

              <button
                type="button"
                disabled={savingCard}
                onClick={() => deleteCard(cardTarget.id)}
                className="flex w-full items-center rounded-xl border border-[#ef3d43] px-3 py-2 text-[16px] font-semibold text-[#ef3d43] disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                ลบบัตร
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCardTarget(null)}
              className="mt-3 w-full rounded-xl border border-[#2f6ef4] py-2 text-[16px] font-semibold text-[#2f6ef4]"
            >
              ปิด
            </button>
          </div>
        </div>
      ) : null}

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
