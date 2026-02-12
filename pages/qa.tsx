import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Headset,
  Loader2,
  MessageSquareText,
  PackageSearch,
  Search,
  Send,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";

type FaqItem = {
  id: string;
  question: string;
  answer?: string | null;
};

type FaqResponse = {
  faqs?: FaqItem[];
  error?: string;
};

type TopicKey = "all" | "orders" | "payment" | "shipping" | "general";

type TopicConfig = {
  label: string;
  emptyHint: string;
};

const TOPIC_CONFIG: Record<TopicKey, TopicConfig> = {
  all: { label: "ทั้งหมด", emptyHint: "ยังไม่มีคำถามในระบบ" },
  orders: { label: "คำสั่งซื้อ", emptyHint: "ยังไม่มีคำถามหมวดคำสั่งซื้อ" },
  payment: { label: "การชำระเงิน", emptyHint: "ยังไม่มีคำถามหมวดการชำระเงิน" },
  shipping: { label: "การจัดส่ง", emptyHint: "ยังไม่มีคำถามหมวดการจัดส่ง" },
  general: { label: "ทั่วไป", emptyHint: "ยังไม่มีคำถามทั่วไป" },
};

function inferTopic(question: string, answer?: string | null): TopicKey {
  const text = `${question} ${answer ?? ""}`.toLowerCase();

  if (
    text.includes("ชำระ") ||
    text.includes("จ่าย") ||
    text.includes("บัตร") ||
    text.includes("คูปอง") ||
    text.includes("payment")
  ) {
    return "payment";
  }

  if (
    text.includes("จัดส่ง") ||
    text.includes("พัสดุ") ||
    text.includes("ขนส่ง") ||
    text.includes("ที่อยู่") ||
    text.includes("shipping")
  ) {
    return "shipping";
  }

  if (
    text.includes("คำสั่งซื้อ") ||
    text.includes("สั่งซื้อ") ||
    text.includes("ออเดอร์") ||
    text.includes("order")
  ) {
    return "orders";
  }

  return "general";
}

export default function QaPage() {
  const router = useRouter();
  const { lang } = useTranslation("common");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [openFaqId, setOpenFaqId] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [activeTopic, setActiveTopic] = useState<TopicKey>("all");

  const locale = lang === "en" ? "en" : "th";
  const questionLimit = 280;

  useEffect(() => {
    let cancelled = false;

    const loadFaqs = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(`/api/faqs?locale=${locale}`);
        const json = (await res.json()) as FaqResponse;

        if (!res.ok) {
          if (!cancelled) {
            setErrorMessage(json.error ?? "ไม่สามารถโหลดคำถามที่พบบ่อยได้");
          }
          return;
        }

        if (cancelled) return;
        const nextFaqs = Array.isArray(json.faqs) ? json.faqs : [];
        setFaqs(nextFaqs);
      } catch {
        if (!cancelled) {
          setErrorMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFaqs();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const filteredFaqs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return faqs.filter((item) => {
      const topic = inferTopic(item.question, item.answer);
      const matchTopic = activeTopic === "all" || activeTopic === topic;
      const matchKeyword =
        keyword.length === 0 ||
        item.question.toLowerCase().includes(keyword) ||
        (item.answer ?? "").toLowerCase().includes(keyword);

      return matchTopic && matchKeyword;
    });
  }, [activeTopic, faqs, searchText]);

  useEffect(() => {
    if (filteredFaqs.length === 0) {
      setOpenFaqId("");
      return;
    }
    const hasOpenFaq = filteredFaqs.some((item) => item.id === openFaqId);
    if (!hasOpenFaq) {
      setOpenFaqId(filteredFaqs[0].id);
    }
  }, [filteredFaqs, openFaqId]);

  const topicCounts = useMemo(() => {
    const base: Record<TopicKey, number> = {
      all: faqs.length,
      orders: 0,
      payment: 0,
      shipping: 0,
      general: 0,
    };

    for (const item of faqs) {
      const topic = inferTopic(item.question, item.answer);
      base[topic] += 1;
    }
    return base;
  }, [faqs]);

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = newQuestion.trim();
    if (!question || submitting) return;

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/faqs?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const json = (await res.json()) as FaqItem & { error?: string };
      if (!res.ok) {
        setErrorMessage(json.error ?? "ส่งคำถามไม่สำเร็จ");
        return;
      }

      setSuccessMessage("ส่งคำถามเรียบร้อยแล้ว ทีมงานจะตอบกลับให้เร็วที่สุด");
      setNewQuestion("");

      if (json.id && json.question) {
        setFaqs((prev) => [
          { id: json.id, question: json.question, answer: json.answer },
          ...prev,
        ]);
      }
    } catch {
      setErrorMessage("ส่งคำถามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    goBackOrPush(router, "/account");
  };

  const hasFilter = activeTopic !== "all" || searchText.trim().length > 0;
  const selectedTopicLabel = TOPIC_CONFIG[activeTopic].label;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
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

            <div className="ml-4 min-w-0">
              <h1 className="truncate text-[30px] font-extrabold leading-none tracking-tight text-black">
                ช่วยเหลือ
              </h1>
              <p className="truncate text-[16px] text-[#6b7280]">
                คำถามที่พบบ่อย และการใช้งาน
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-4 px-4 pb-[120px] pt-4">
          <section className="rounded-[24px] bg-gradient-to-br from-[#2f6ef4] to-[#4e8cff] p-4 text-white shadow-[0_10px_20px_rgba(47,110,244,0.25)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Headset className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[25px] font-extrabold leading-tight">ศูนย์ช่วยเหลือ</h2>
                <p className="mt-1 text-[16px] leading-snug text-white/90">
                  ค้นหาคำตอบด้วยตัวเองได้ทันที หรือส่งคำถามให้ทีมงานช่วยตรวจสอบ
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push("/contact")}
                className="rounded-xl bg-white py-2.5 text-[17px] font-semibold text-[#2f6ef4]"
              >
                ติดต่อเจ้าหน้าที่
              </button>
              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="rounded-xl border border-white/70 bg-white/10 py-2.5 text-[17px] font-semibold text-white"
              >
                ดูคำสั่งซื้อ
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3">
            <h2 className="text-[21px] font-extrabold text-[#111827]">ค้นหาคำถาม</h2>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="พิมพ์คำถาม เช่น จัดส่งสินค้า หรือ ชำระเงิน"
                className="h-12 w-full rounded-xl border border-[#d8d8db] bg-[#f9fafb] pl-10 pr-10 text-[17px] outline-none placeholder:text-[#9ca3af] focus:border-[#2f6ef4]"
              />
              {searchText ? (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => setSearchText("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#6b7280]"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {(Object.keys(TOPIC_CONFIG) as TopicKey[]).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(topic)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[15px] font-semibold ${
                    activeTopic === topic
                      ? "bg-[#2f6ef4] text-white"
                      : "bg-[#e8edf7] text-[#4b5563]"
                  }`}
                >
                  {TOPIC_CONFIG[topic].label} ({topicCounts[topic]})
                </button>
              ))}
            </div>

            <p className="mt-2 text-[14px] text-[#6b7280]">
              พบ {filteredFaqs.length} คำถามในหมวด {selectedTopicLabel}
            </p>
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <CircleHelp className="h-6 w-6 text-[#2f6ef4]" />
                <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                  คำถามที่พบบ่อย
                </h2>
              </div>

              {hasFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setActiveTopic("all");
                  }}
                  className="rounded-lg border border-[#d8d8db] px-2.5 py-1 text-[14px] font-semibold text-[#4b5563]"
                >
                  ล้างตัวกรอง
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-2 py-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-[#eef2f7]"
                  />
                ))}
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8d8db] bg-[#f9fafb] p-4 text-center">
                <p className="text-[17px] text-[#6b7280]">
                  {hasFilter
                    ? "ไม่พบคำถามที่ตรงกับการค้นหา"
                    : TOPIC_CONFIG[activeTopic].emptyHint}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFaqs.map((faq) => {
                  const open = openFaqId === faq.id;
                  const topic = inferTopic(faq.question, faq.answer);
                  return (
                    <article key={faq.id} className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfd]">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId((prev) => (prev === faq.id ? "" : faq.id))}
                        className="flex w-full items-start gap-2 px-3 py-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[18px] font-semibold leading-tight text-[#1f2937]">
                            {faq.question}
                          </p>
                          <span className="mt-1 inline-flex rounded-full bg-[#eef3ff] px-2 py-0.5 text-[12px] font-semibold text-[#2f6ef4]">
                            {TOPIC_CONFIG[topic].label}
                          </span>
                        </div>
                        <ChevronDown
                          className={`mt-0.5 h-5 w-5 flex-shrink-0 text-[#6b7280] transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {open ? (
                        <div className="border-t border-[#e5e7eb] px-3 py-3">
                          <p className="text-[16px] leading-relaxed text-[#4b5563]">
                            {faq.answer?.trim() || "ทีมงานกำลังเตรียมคำตอบให้คุณอยู่"}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-2">
            <ShortcutButton
              icon={<ShoppingBag className="h-6 w-6 text-[#2f6ef4]" />}
              label="คำสั่งซื้อ"
              onClick={() => router.push("/orders")}
            />
            <ShortcutButton
              icon={<PackageSearch className="h-6 w-6 text-[#2f6ef4]" />}
              label="ติดตามพัสดุ"
              onClick={() => router.push("/orders")}
            />
            <ShortcutButton
              icon={<CreditCard className="h-6 w-6 text-[#2f6ef4]" />}
              label="วิธีชำระเงิน"
              onClick={() => router.push("/account/settings/payment")}
            />
            <ShortcutButton
              icon={<Truck className="h-6 w-6 text-[#2f6ef4]" />}
              label="ค่าจัดส่ง"
              onClick={() => router.push("/cart")}
            />
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3">
            <div className="mb-2 flex items-center">
              <MessageSquareText className="h-6 w-6 text-[#2f6ef4]" />
              <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                ส่งคำถามเพิ่มเติม
              </h2>
            </div>

            <form onSubmit={submitQuestion} className="space-y-2">
              <textarea
                value={newQuestion}
                maxLength={questionLimit}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="พิมพ์คำถามที่ต้องการสอบถาม..."
                className="min-h-[128px] w-full rounded-xl border border-[#d8d8db] bg-[#f9fafb] px-3 py-2 text-[17px] outline-none placeholder:text-[#9ca3af] focus:border-[#2f6ef4]"
              />

              <div className="flex items-center justify-between text-[14px] text-[#6b7280]">
                <p>ทีมงานจะตอบกลับให้เร็วที่สุด</p>
                <p>
                  {newQuestion.length}/{questionLimit}
                </p>
              </div>

              {errorMessage ? (
                <p className="rounded-lg border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[15px] text-[#db4f4f]">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="rounded-lg border border-[#bfe8cf] bg-[#edfdf2] px-3 py-2 text-[15px] text-[#22995d]">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || newQuestion.trim().length === 0}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f6ef4] text-[19px] font-semibold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    ส่งคำถาม
                  </>
                )}
              </button>
            </form>
          </section>
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}

function ShortcutButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[#d8d8db] bg-white p-3 text-left"
    >
      {icon}
      <p className="mt-1 text-[16px] font-semibold leading-tight text-[#1f2937]">{label}</p>
    </button>
  );
}
