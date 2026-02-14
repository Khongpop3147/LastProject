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
  const { t, lang } = useTranslation("common");

  const TOPIC_CONFIG: Record<TopicKey, TopicConfig> = {
    all: { label: t("qa.topicAll"), emptyHint: t("qa.emptyAll") },
    orders: { label: t("qa.topicOrders"), emptyHint: t("qa.emptyOrders") },
    payment: { label: t("qa.topicPayment"), emptyHint: t("qa.emptyPayment") },
    shipping: {
      label: t("qa.topicShipping"),
      emptyHint: t("qa.emptyShipping"),
    },
    general: { label: t("qa.topicGeneral"), emptyHint: t("qa.emptyGeneral") },
  };

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
            setErrorMessage(json.error ?? t("qa.loadError"));
          }
          return;
        }

        if (cancelled) return;
        const nextFaqs = Array.isArray(json.faqs) ? json.faqs : [];
        setFaqs(nextFaqs);
      } catch {
        if (!cancelled) {
          setErrorMessage(t("qa.serverError"));
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
        setErrorMessage(json.error ?? t("qa.submitError"));
        return;
      }

      setSuccessMessage(t("qa.submitSuccess"));
      setNewQuestion("");

      if (json.id && json.question) {
        setFaqs((prev) => [
          { id: json.id, question: json.question, answer: json.answer },
          ...prev,
        ]);
      }
    } catch {
      setErrorMessage(t("qa.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

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

  const hasFilter = activeTopic !== "all" || searchText.trim().length > 0;
  const selectedTopicLabel = TOPIC_CONFIG[activeTopic].label;

  return (
    <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      {/* Mobile Header - Mobile Only */}
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

            <div className="ml-4 min-w-0">
              <h1 className="truncate text-[22px] font-extrabold leading-tight tracking-tight text-black">
                {t("qa.helpTitle")}
              </h1>
              <p className="truncate text-[14px] text-[#6b7280]">
                {t("qa.helpSubtitle")}
              </p>
            </div>
          </header>
        </div>
      </div>

      {/* Desktop & Mobile Content */}
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 md:mt-6 md:pt-8 desktop-shell">
        {/* Desktop Header - Desktop Only */}
        <div className="hidden md:block mb-8">
          <h1 className="text-[30px] md:text-[32px] font-extrabold text-black md:text-teal-900">
            {t("qa.helpTitle")}
          </h1>
          <p className="text-[16px] md:text-[17px] text-[#6b7280]">{t("qa.helpSubtitle")}</p>
        </div>

        <main className="space-y-4 pb-[120px] md:pb-12 pt-4 md:pt-0">
          <section className="rounded-[24px] bg-gradient-to-br from-[#0f766e] to-[#14b8a6] p-4 md:p-6 text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)]">
            <div className="md:flex md:items-center md:justify-between md:gap-6">
              <div className="flex items-start gap-3 md:items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <Headset className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[25px] font-extrabold leading-tight">
                    {t("qa.helpCenter")}
                  </h2>
                  <p className="mt-1 text-[16px] leading-snug text-white/90">
                    {t("qa.helpCenterDesc")}
                  </p>
                </div>
              </div>

              <div className="mt-3 md:mt-0 grid grid-cols-2 md:flex md:flex-row md:flex-shrink-0 gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/contact")}
                  className="rounded-xl bg-white py-2.5 px-4 text-[17px] font-semibold text-teal-700 md:whitespace-nowrap"
                >
                  {t("qa.contactStaff")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  className="rounded-xl border border-white/70 bg-white/10 py-2.5 px-4 text-[17px] font-semibold text-white md:whitespace-nowrap"
                >
                  {t("qa.viewOrders")}
                </button>
              </div>
            </div>
          </section>

          {/* Desktop two-column / Mobile single-column */}
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-6 md:items-start">
            {/* Left column: Search + FAQ */}
            <div className="space-y-4">
              <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3 md:p-4">
                <h2 className="text-[21px] font-extrabold text-[#111827]">
                  {t("qa.searchQuestions")}
                </h2>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={t("qa.searchPlaceholder")}
                    className="h-12 w-full rounded-xl border border-[#d8d8db] bg-[#f9fafb] pl-10 pr-10 text-[17px] outline-none placeholder:text-[#9ca3af] focus:border-teal-600"
                  />
                  {searchText ? (
                    <button
                      type="button"
                      aria-label={t("common.clearSearch")}
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
                          ? "bg-teal-600 text-white"
                          : "bg-teal-50 text-[#4b5563]"
                      }`}
                    >
                      {TOPIC_CONFIG[topic].label} ({topicCounts[topic]})
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-[14px] text-[#6b7280]">
                  {t("qa.foundQuestions", {
                    count: filteredFaqs.length,
                    topic: selectedTopicLabel,
                  })}
                </p>
              </section>

              <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3 md:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <CircleHelp className="h-6 w-6 text-teal-700" />
                    <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                      {t("qa.faqTitle")}
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
                      {t("common.clearFilter")}
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
                        ? t("qa.noMatch")
                        : TOPIC_CONFIG[activeTopic].emptyHint}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFaqs.map((faq) => {
                      const open = openFaqId === faq.id;
                      const topic = inferTopic(faq.question, faq.answer);
                      return (
                        <article
                          key={faq.id}
                          className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfd] md:hover:border-teal-200 md:hover:shadow-sm md:transition-all"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenFaqId((prev) =>
                                prev === faq.id ? "" : faq.id,
                              )
                            }
                            className="flex w-full items-start gap-2 px-3 py-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[18px] font-semibold leading-tight text-[#1f2937]">
                                {faq.question}
                              </p>
                              <span className="mt-1 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[12px] font-semibold text-teal-700">
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
                                {faq.answer?.trim() || t("qa.preparingAnswer")}
                              </p>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right sidebar: Shortcuts + Question Form */}
            <div className="space-y-4 mt-4 md:mt-0 md:sticky md:top-8">
              <section className="grid grid-cols-2 gap-2 md:gap-3">
                <ShortcutButton
                  icon={<ShoppingBag className="h-6 w-6 text-teal-700" />}
                  label={t("qa.shortcutOrders")}
                  onClick={() => router.push("/orders")}
                />
                <ShortcutButton
                  icon={<PackageSearch className="h-6 w-6 text-teal-700" />}
                  label={t("qa.shortcutTracking")}
                  onClick={() => router.push("/orders")}
                />
                <ShortcutButton
                  icon={<CreditCard className="h-6 w-6 text-teal-700" />}
                  label={t("qa.shortcutPayment")}
                  onClick={() => router.push("/account/settings/payment")}
                />
                <ShortcutButton
                  icon={<Truck className="h-6 w-6 text-teal-700" />}
                  label={t("qa.shortcutDelivery")}
                  onClick={() => router.push("/cart")}
                />
              </section>

              <section className="rounded-2xl border border-[#e3e4e7] bg-white p-3 md:p-4">
                <div className="mb-2 flex items-center">
                  <MessageSquareText className="h-6 w-6 text-teal-700" />
                  <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                    {t("qa.additionalQuestion")}
                  </h2>
                </div>

                <form onSubmit={submitQuestion} className="space-y-2">
                  <textarea
                    value={newQuestion}
                    maxLength={questionLimit}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    placeholder={t("qa.questionPlaceholder")}
                    className="min-h-[128px] md:min-h-[160px] w-full rounded-xl border border-[#d8d8db] bg-[#f9fafb] px-3 py-2 text-[17px] outline-none placeholder:text-[#9ca3af] focus:border-teal-600"
                  />

                  <div className="flex items-center justify-between text-[14px] text-[#6b7280]">
                    <p>{t("qa.replyInfo")}</p>
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
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-[19px] font-semibold text-white disabled:opacity-60 md:hover:bg-teal-700 md:transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("qa.sending")}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        {t("qa.sendQuestion")}
                      </>
                    )}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <MobileShopBottomNav activePath="/account" />
      </div>
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
      className="rounded-xl border border-[#d8d8db] bg-white p-3 text-left md:p-4 md:hover:border-teal-300 md:hover:shadow-sm md:transition-all"
    >
      {icon}
      <p className="mt-1 text-[16px] font-semibold leading-tight text-[#1f2937]">
        {label}
      </p>
    </button>
  );
}
