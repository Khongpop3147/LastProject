import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { ArrowLeft, Camera, UserRound } from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";
import { goBackOrPush } from "@/lib/navigation";

type ProfileResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
};

type FormState = {
  name: string;
  email: string;
  newPassword: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  newPassword: "",
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

function toPayload(form: FormState, baseline: FormState) {
  const payload: { name?: string; email?: string; newPassword?: string } = {};
  if (form.name.trim() && form.name.trim() !== baseline.name.trim()) {
    payload.name = form.name.trim();
  }
  if (form.email.trim() && form.email.trim() !== baseline.email.trim()) {
    payload.email = form.email.trim();
  }
  if (form.newPassword.trim()) {
    payload.newPassword = form.newPassword.trim();
  }
  return payload;
}

export default function AccountProfilePage() {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [baseline, setBaseline] = useState<FormState>(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = (await res.json()) as ProfileResponse;
        if (!res.ok || !data.user) {
          if (!cancelled) {
            setErrorMessage(data.error ?? "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
          }
          return;
        }

        if (cancelled) return;

        const next: FormState = {
          name: data.user.name ?? "",
          email: data.user.email ?? "",
          newPassword: "",
        };
        setForm(next);
        setBaseline(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  const canSubmit = useMemo(() => {
    if (saving || loading) return false;
    const payload = toPayload(form, baseline);
    return Object.keys(payload).length > 0;
  }, [baseline, form, loading, saving]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const payload = toPayload(form, baseline);
    if (Object.keys(payload).length === 0) {
      setErrorMessage("ยังไม่มีข้อมูลที่เปลี่ยนแปลง");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as ProfileResponse;
      if (!res.ok || !data.user) {
        setErrorMessage(data.error ?? "บันทึกข้อมูลไม่สำเร็จ");
        return;
      }

      const next: FormState = {
        name: data.user.name ?? "",
        email: data.user.email ?? "",
        newPassword: "",
      };
      setForm(next);
      setBaseline(next);
      setSuccessMessage("บันทึกการเปลี่ยนแปลงเรียบร้อย");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    goBackOrPush(router, "/account");
  };

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

            <div className="ml-4">
              <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-black">
                แก้ไขโปรไฟล์
              </h1>
              <p className="text-[16px] text-[#6b7280]">โปรไฟล์ของคุณ</p>
            </div>
          </div>
        </header>

        <main className="px-4 pb-[120px] pt-4">
          <section className="mb-4 flex justify-center">
            <div className="relative">
              <div className="flex h-[156px] w-[156px] items-center justify-center rounded-full bg-[#e5e7eb] text-[#6b7280]">
                <UserRound className="h-[76px] w-[76px]" strokeWidth={1.8} />
              </div>
              <button
                type="button"
                aria-label="อัปเดตรูปโปรไฟล์"
                disabled
                className="absolute bottom-1 right-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6ef4] text-white shadow-[0_6px_14px_rgba(47,110,244,0.35)] disabled:opacity-80"
              >
                <Camera className="h-6 w-6" />
              </button>
            </div>
          </section>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[18px] font-semibold text-[#374151]">
                ชื่อ-นามสกุล
              </label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="กรอกชื่อ-นามสกุล"
                className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[18px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[18px] font-semibold text-[#374151]">อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="กรอกอีเมล"
                className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[18px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[18px] font-semibold text-[#374151]">
                รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="h-14 w-full rounded-2xl border border-[#d9dee7] bg-[#eef2f8] px-4 text-[18px] outline-none placeholder:text-[#8f99ac] focus:border-[#2f6ef4]"
              />
            </div>

            <p className="text-[14px] text-[#6b7280]">
              ระบบ backend ปัจจุบันรองรับการแก้ไขชื่อ, อีเมล และรหัสผ่านเท่านั้น
            </p>

            {errorMessage ? (
              <p className="rounded-xl border border-[#ffc9c9] bg-[#fff2f2] px-3 py-2 text-[16px] text-[#db4f4f]">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl border border-[#bfe8cf] bg-[#edfdf2] px-3 py-2 text-[16px] text-[#22995d]">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-[#2f6ef4] py-3 text-[22px] font-semibold leading-none text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </form>
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}
