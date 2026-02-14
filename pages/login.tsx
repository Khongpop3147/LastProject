"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form.email, form.password, form.remember);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Layout title={t("auth.login.pageTitle")} hideBottomNav>
      <div className="mx-auto w-full max-w-[440px] md:max-w-6xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <div className="grid overflow-hidden rounded-[28px] border border-[#d9e0eb] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] md:min-h-[680px] md:grid-cols-[1.05fr_0.95fr] desktop-shell">
          <div className="p-5 md:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <h2 className="mb-6 text-3xl font-bold text-[#0f766e] md:text-4xl">
                {t("auth.login.heading")}
              </h2>

              {error ? (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600">
                  {error}
                </p>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("auth.fields.emailLabel")}
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      placeholder={t("auth.fields.emailPlaceholder")}
                      value={form.email}
                      onChange={onChange}
                      required
                      className="w-full rounded-2xl border border-[#d4dbe7] bg-[#f4f7fb] px-4 py-3 pr-12 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#2f6ef4]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2f6ef4]">
                      <Mail size={20} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("auth.fields.passwordLabel")}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      placeholder={t("auth.fields.passwordPlaceholder")}
                      value={form.password}
                      onChange={onChange}
                      required
                      className="w-full rounded-2xl border border-[#d4dbe7] bg-[#f4f7fb] px-4 py-3 pr-12 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#2f6ef4]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2f6ef4]">
                      <Lock size={20} />
                    </div>
                  </div>
                </div>

                <div className="mb-1 flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 text-gray-600">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={onChange}
                      className="h-4 w-4"
                    />
                    <span>{t("auth.login.rememberMe")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="font-medium text-[#2f6ef4] hover:underline"
                  >
                    {t("auth.login.forgotPassword")}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#2f6ef4] py-3 text-[18px] font-semibold text-white transition hover:bg-[#265ed2]"
                >
                  {t("auth.login.submit")}
                </button>
              </form>

              <div className="my-6 flex w-full items-center">
                <div className="h-px flex-grow bg-gray-300" />
                <span className="mx-4 flex-shrink-0 text-sm text-gray-500">
                  {t("auth.login.continueWith")}
                </span>
                <div className="h-px flex-grow bg-gray-300" />
              </div>

              <div className="mb-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => console.log("Line Login")}
                  className="h-12 w-12 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
                >
                  <Image
                    src="/images/line.png"
                    alt="Line Login"
                    width={48}
                    height={48}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </button>
              </div>

              <button
                onClick={() => router.push("/register")}
                className="w-full rounded-2xl border-2 border-[#2f6ef4] py-3 text-[18px] font-semibold text-[#2f6ef4] transition hover:bg-blue-50"
              >
                {t("auth.login.signUpNow")}
              </button>
            </div>
          </div>

          <div className="relative hidden md:block">
            <Image
              src="/images/image.png"
              alt="Login Illustration"
              fill
              sizes="(min-width: 1280px) 540px, (min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/90 px-5 py-4 backdrop-blur-sm">
              <p className="text-[14px] font-semibold text-[#0f172a]">
                {t("auth.login.infoText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
