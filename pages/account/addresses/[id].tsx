import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  House,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";
import {
  AddressType,
  getAddressMeta,
  getAddressTypeDefaultLabel,
  getDefaultAddressId,
  setAddressMeta,
  setCheckoutSelectedAddressId,
  setDefaultAddressId,
} from "@/lib/addressStorage";
import { buildAddressLine2, parseAddressLine2 } from "@/lib/addressLine2";
import provincesMap from "@/data/provinces.json";

type AddressItem = {
  id: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

type AddressTypeOption = {
  type: AddressType;
  label: string;
  icon: typeof House;
};

const ADDRESS_TYPE_OPTIONS: AddressTypeOption[] = [
  { type: "home", label: "บ้าน", icon: House },
  { type: "work", label: "ที่ทำงาน", icon: BriefcaseBusiness },
  { type: "other", label: "อื่นๆ", icon: Building2 },
];

type AddressFormState = {
  type: AddressType;
  label: string;
  recipient: string;
  phone: string;
  city: string;
  line1: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  country: string;
};

const INITIAL_FORM: AddressFormState = {
  type: "home",
  label: "บ้าน",
  recipient: "",
  phone: "",
  city: "กรุงเทพมหานคร",
  line1: "",
  district: "",
  subdistrict: "",
  postalCode: "",
  country: "ไทย",
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toLabel(value: AddressType, label: string) {
  const normalized = label.trim();
  if (normalized.length > 0) return normalized;
  return getAddressTypeDefaultLabel(value);
}

export default function AddressEditorPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [form, setForm] = useState<AddressFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const addressId = typeof router.query.id === "string" ? router.query.id : "";
  const fromCheckout = router.query.from === "checkout";
  const isCreateMode = addressId === "new";

  const provinces = useMemo(() => Object.keys(provincesMap), []);

  useEffect(() => {
    if (!router.isReady) return;

    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    if (isCreateMode) {
      setForm(INITIAL_FORM);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAddress = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/addresses/${addressId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!res.ok) {
          setErrorMessage("ไม่สามารถโหลดข้อมูลที่อยู่ได้");
          return;
        }

        const response = (await res.json()) as { address: AddressItem };
        if (cancelled) return;

        const data = response.address;
        const line2Meta = parseAddressLine2(data.line2);
        const meta = getAddressMeta(data.id);

        setForm({
          type: meta.type,
          label: meta.label || getAddressTypeDefaultLabel(meta.type),
          recipient: data.recipient ?? "",
          phone: line2Meta.phone ?? "",
          city: data.city ?? "กรุงเทพมหานคร",
          line1: data.line1 ?? "",
          district: line2Meta.district ?? "",
          subdistrict: line2Meta.subdistrict ?? "",
          postalCode: data.postalCode ?? "",
          country: data.country ?? "ไทย",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAddress();
    return () => {
      cancelled = true;
    };
  }, [addressId, isCreateMode, router, router.isReady, token]);

  const handleBack = () => {
    const fallback = fromCheckout
      ? "/account/addresses?from=checkout"
      : "/account/addresses";
    goBackOrPush(router, fallback);
  };

  const updateField = <K extends keyof AddressFormState>(
    key: K,
    value: AddressFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!form.recipient.trim()) return "กรุณากรอกชื่อผู้รับ";
    if (!form.phone.trim()) return "กรุณากรอกเบอร์โทรศัพท์";
    if (!form.city.trim()) return "กรุณาเลือกจังหวัด";
    if (!form.line1.trim()) return "กรุณากรอกที่อยู่";
    if (!form.district.trim()) return "กรุณากรอกเขต/อำเภอ";
    if (!form.subdistrict.trim()) return "กรุณากรอกแขวง/ตำบล";
    if (!form.postalCode.trim()) return "กรุณากรอกรหัสไปรษณีย์";
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      const line2 = buildAddressLine2({
        phone: form.phone,
        district: form.district,
        subdistrict: form.subdistrict,
      });

      const payload = {
        recipient: form.recipient.trim(),
        line1: form.line1.trim(),
        line2,
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || "ไทย",
      };

      const endpoint = isCreateMode
        ? "/api/addresses"
        : `/api/addresses/${addressId}`;
      const method = isCreateMode ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setErrorMessage(err.error ?? "บันทึกที่อยู่ไม่สำเร็จ");
        setSubmitting(false);
        return;
      }

      const responseData = (await res.json()) as { address: AddressItem };
      const saved = responseData.address;
      const finalLabel = toLabel(form.type, form.label);
      setAddressMeta(saved.id, { type: form.type, label: finalLabel });

      const defaultAddressId = getDefaultAddressId();
      if (!defaultAddressId) {
        setDefaultAddressId(saved.id);
      }

      if (fromCheckout) {
        setCheckoutSelectedAddressId(saved.id);
        router.push("/checkout");
        return;
      }

      router.push("/account/addresses");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl">
        <header className="sticky top-16 sm:top-20 md:top-24 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4] md:bg-white md:shadow-sm">
          <div className="flex h-[94px] md:h-[102px] items-center px-4 md:px-6">
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
                ที่อยู่จัดส่ง
              </h1>
              <p className="text-[15px] text-[#6b7280]">
                {isCreateMode ? "เพิ่มที่อยู่ใหม่" : "แก้ไขที่อยู่"}
              </p>
            </div>
          </div>
        </header>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-3 px-4 pb-[250px] pt-4"
        >
          {loading ? (
            <div className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[17px] text-[#6b7280]">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <>
              <section>
                <h2 className="mb-2 text-[20px] font-bold text-[#6b7280]">
                  ประเภทที่อยู่
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {ADDRESS_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = form.type === option.type;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            type: option.type,
                            label:
                              prev.label.trim().length > 0 &&
                              prev.label !==
                                getAddressTypeDefaultLabel(prev.type)
                                ? prev.label
                                : getAddressTypeDefaultLabel(option.type),
                          }))
                        }
                        className={`rounded-2xl border p-3 text-center ${
                          active
                            ? "border-[#2f6ef4] bg-[#edf3ff] text-[#2f6ef4]"
                            : "border-[#cfd5df] bg-white text-[#6b7280]"
                        }`}
                      >
                        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center">
                          <Icon className="h-7 w-7" strokeWidth={2.25} />
                        </div>
                        <div className="text-[17px] font-semibold">
                          {option.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    ชื่อที่อยู่ (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => updateField("label", e.target.value)}
                    placeholder={getAddressTypeDefaultLabel(form.type)}
                    className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    ชื่อผู้รับ *
                  </label>
                  <input
                    type="text"
                    value={form.recipient}
                    onChange={(e) => updateField("recipient", e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    จังหวัด
                  </label>
                  <div className="relative">
                    <select
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="h-14 w-full appearance-none rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 pr-10 text-[17px] text-[#2f6ef4] outline-none focus:border-[#2f6ef4]"
                    >
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#2f6ef4]" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    ที่อยู่ (บ้านเลขที่, ซอย, ถนน) *
                  </label>
                  <textarea
                    rows={3}
                    value={form.line1}
                    onChange={(e) => updateField("line1", e.target.value)}
                    placeholder="กรอกที่อยู่"
                    className="w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 py-3 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                      เขต/อำเภอ
                    </label>
                    <input
                      type="text"
                      value={form.district}
                      onChange={(e) => updateField("district", e.target.value)}
                      placeholder="กรอกเขต/อำเภอ"
                      className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                      แขวง/ตำบล
                    </label>
                    <input
                      type="text"
                      value={form.subdistrict}
                      onChange={(e) =>
                        updateField("subdistrict", e.target.value)
                      }
                      placeholder="กรอกแขวง/ตำบล"
                      className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-3 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[17px] font-semibold text-[#6b7280]">
                    รหัสไปรษณีย์
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="กรอกรหัสไปรษณีย์"
                    className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[17px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
                  />
                </div>
              </section>

              {errorMessage ? (
                <p className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[18px] text-[#db4f4f]">
                  {errorMessage}
                </p>
              ) : null}
            </>
          )}
        </form>
      </div>

      {!loading ? (
        <div
          className="fixed left-0 right-0 z-50 border-t border-[#d8d8d8] bg-white px-4 pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]"
          style={{
            bottom: "calc(84px + env(safe-area-inset-bottom))",
            paddingBottom: "12px",
          }}
        >
          <div className="mx-auto w-full max-w-[440px] space-y-3">
            <button
              type="button"
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
              disabled={submitting}
              className="w-full rounded-2xl bg-[#2f6ef4] py-3 text-[20px] font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "กำลังบันทึก..."
                : isCreateMode
                  ? "เพิ่มที่อยู่"
                  : "บันทึกที่อยู่"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-2xl border-2 border-[#2f6ef4] py-3 text-[20px] font-semibold text-[#2f6ef4]"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : null}

      <MobileShopBottomNav activePath="/cart" />
    </div>
  );
}
