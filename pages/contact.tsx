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

type ContactCard = {
  title: string;
  value: string;
  href: string;
  icon: typeof PhoneCall;
  iconBg: string;
  iconColor: string;
};

const CONTACT_CARDS: ContactCard[] = [
  {
    title: "โทรศัพท์",
    value: "02-123-4567",
    href: "tel:021234567",
    icon: PhoneCall,
    iconBg: "bg-[#e1f7ec]",
    iconColor: "text-[#22b35f]",
  },
  {
    title: "LINE Official",
    value: "@simplyshopthai",
    href: "https://line.me",
    icon: MessageCircle,
    iconBg: "bg-[#e1f7ec]",
    iconColor: "text-[#22b35f]",
  },
  {
    title: "อีเมล",
    value: "support@simplyshop.co.th",
    href: "mailto:support@simplyshop.co.th",
    icon: Mail,
    iconBg: "bg-[#e7efff]",
    iconColor: "text-[#2f6ef4]",
  },
  {
    title: "Facebook",
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
  const router = useRouter();
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleBack = () => {
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
        setErrorMessage(json.error ?? "ส่งข้อความไม่สำเร็จ");
        return;
      }

      setSuccessMessage(
        "ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด",
      );
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch {
      setErrorMessage("ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px] md:max-w-4xl">
        <header className="sticky top-16 sm:top-20 md:top-24 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4] md:bg-white md:shadow-sm">
          <div className="flex h-[92px] md:h-[100px] items-center px-4 md:px-6">
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
                ติดต่อเรา
              </h1>
              <p className="text-[16px] text-[#6b7280]">
                สอบถามข้อมูล แจ้งปัญหา
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-4 px-4 pb-[120px] pt-4">
          <section>
            <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">
              ช่องทางติดต่อ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTACT_CARDS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
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
                      {item.title}
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
                เวลาทำการ
              </h2>
            </div>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              จันทร์ - ศุกร์: 09:00 - 18:00 น.
            </p>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              เสาร์ - อาทิตย์: 10:00 - 16:00 น.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e3e4e7] bg-white p-4">
            <div className="mb-1 flex items-center">
              <MapPin className="h-6 w-6 text-[#2f6ef4]" />
              <h2 className="ml-2 text-[24px] font-extrabold text-[#111827]">
                ที่อยู่สำนักงาน
              </h2>
            </div>
            <p className="text-[17px] leading-tight text-[#4b5563]">
              123 อาคารสุขสันต์ ชั้น 15 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา
              กรุงเทพมหานคร 10110
            </p>
          </section>

          <section className="rounded-2xl border border-[#d8d8d8] bg-white p-4">
            <h2 className="text-[24px] font-extrabold text-[#1f2937]">
              ส่งข้อความถึงเรา
            </h2>

            <form onSubmit={handleSubmit} className="mt-2 space-y-2">
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="ชื่อ-นามสกุล *"
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="อีเมล *"
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <input
                type="text"
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="หัวข้อ *"
                className="h-12 w-full rounded-xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[16px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                placeholder="รายละเอียดที่ต้องการติดต่อ *"
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
                {submitting ? "กำลังส่ง..." : "ส่งข้อความ"}
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
