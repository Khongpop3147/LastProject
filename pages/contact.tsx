import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Clock3,
  Facebook,
  Mail,
  MapPin,
  MessageCircle,
  PhoneCall,
  Send,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";
import useTranslation from "next-translate/useTranslation";

type ContactCard = {
  titleKey: string;
  value: string;
  href: string;
  icon: typeof PhoneCall;
  iconBg: string;
  iconColor: string;
};

const CONTACT_CARDS: ContactCard[] = [
  {
    titleKey: "contactPage.cardPhone",
    value: "xxxx-xxxx",
    href: "tel:xxxx-xxxx",
    icon: PhoneCall,
    iconBg: "bg-[#e1f7ec]",
    iconColor: "text-[#22b35f]",
  },
  {
    titleKey: "contactPage.cardLine",
    value: "@xxxxxx",
    href: "https://line.me/R/ti/p/%40simplyshopthai",
    icon: MessageCircle,
    iconBg: "bg-[#e1f7ec]",
    iconColor: "text-[#22b35f]",
  },
  {
    titleKey: "contactPage.cardEmail",
    value: "support@simplyshop.co.th",
    href: "mailto:support@simplyshop.co.th",
    icon: Mail,
    iconBg: "bg-[#e7efff]",
    iconColor: "text-[#2f6ef4]",
  },
  {
    titleKey: "contactPage.cardFacebook",
    value: "Simply Shop Thai",
    href: "https://facebook.com",
    icon: Facebook,
    iconBg: "bg-[#e7efff]",
    iconColor: "text-[#2f6ef4]",
  },
];

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setErrorMessage("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErrorMessage(json.error ?? t("contactPage.sendFailed"));
        return;
      }

      setSuccessMessage(t("contactPage.sendSuccess"));
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch {
      setErrorMessage(t("contactPage.sendFailedRetry"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      {/* Mobile Header - Mobile Only */}
      <div className="md:hidden sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="flex h-[66px] items-center px-4">
            <button
              type="button"
              aria-label={t("common.back")}
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <div className="ml-3 min-w-0">
              <h1 className="truncate text-[22px] font-extrabold leading-tight tracking-tight text-black">
                {t("contactPage.heading")}
              </h1>
              <p className="truncate text-[14px] text-[#6b7280]">
                {t("contactPage.subtitle")}
              </p>
            </div>
          </header>
        </div>
      </div>

      {/* Desktop & Mobile Content */}
      <div className="mx-auto w-full max-w-[440px] md:max-w-4xl px-4 md:px-6 md:mt-6 md:pt-8 desktop-shell">
        {/* Desktop Header - Desktop Only */}
        <div className="hidden md:block mb-6">
          <h1 className="text-[30px] font-extrabold text-black">
            {t("contactPage.heading")}
          </h1>
          <p className="text-[16px] text-[#6b7280]">
            {t("contactPage.subtitle")}
          </p>
        </div>

        <main className="space-y-4 pb-[120px] md:pb-12 pt-4 md:pt-0">
          <section>
            <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">
              {t("contactPage.channelsHeading")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTACT_CARDS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.titleKey}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-[#e3e4e7] bg-white p-4 shadow-[0_2px_6px_rgba(0,0,0,0.05)]"
                  >
                    <div
                      className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconColor}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="line-clamp-1 text-[22px] font-bold leading-tight text-[#111827]">
                      {t(item.titleKey)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 break-all text-[16px] leading-tight text-[#6b7280]">
                      {item.value}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-4">
            <div className="mb-1 flex items-center">
              <Clock3 className="h-6 w-6 text-[#eab308]" />
              <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                {t("contactPage.businessHours")}
              </h2>
            </div>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              {t("contactPage.hoursWeekday")}
            </p>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              {t("contactPage.hoursWeekend")}
            </p>
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-4">
            <div className="mb-1 flex items-center">
              <MapPin className="h-6 w-6 text-[#2f6ef4]" />
              <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                {t("contactPage.officeAddress")}
              </h2>
            </div>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              {t("contactPage.officeAddressDetail")}
            </p>
          </section>

          <section className="rounded-2xl border border-[#d8d8d8] bg-white p-4">
            <h2 className="text-[24px] font-extrabold text-[#1f2937]">
              {t("contactPage.formHeading")}
            </h2>

            <form onSubmit={handleSubmit} className="mt-2 space-y-2">
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t("contactPage.namePlaceholder")}
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder={t("contactPage.emailPlaceholder")}
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <input
                type="text"
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder={t("contactPage.subjectPlaceholder")}
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                placeholder={t("contactPage.messagePlaceholder")}
                className="w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 py-2 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />

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
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2f6ef4] text-[18px] font-semibold text-white disabled:opacity-60"
              >
                <Send className="mr-1 h-5 w-5" />
                {submitting
                  ? t("contactPage.sending")
                  : t("contactPage.sendMessage")}
              </button>
            </form>
          </section>
        </main>
      </div>

      <div className="md:hidden">
        <MobileShopBottomNav activePath="/account" />
      </div>
    </div>
  );
}
