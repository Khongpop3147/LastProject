"use client";
import { useState } from "react";
import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(t("forgotPassword.successMessage"));
      } else {
        setError(data.error || t("forgotPassword.errorGeneric"));
      }
    } catch {
      setError(t("forgotPassword.errorGeneric"));
    }
  };

  return (
    <Layout title={t("forgotPassword.pageTitle")} hideBottomNav>
      <div className="mx-auto w-full max-w-[440px] md:max-w-3xl px-4 md:px-6 pb-8 pt-4 md:pt-8">
        <div className="mx-auto w-full max-w-xl rounded-[28px] border border-[#d9e0eb] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] md:p-10 desktop-shell">
          <h1 className="mb-2 text-3xl font-bold text-[#0f172a]">
            {t("forgotPassword.heading")}
          </h1>
          <p className="mb-6 text-[16px] text-gray-600">
            {t("forgotPassword.description")}
          </p>

          {message ? (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-green-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-[#d4dbe7] bg-[#f4f7fb] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#2f6ef4]"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#2f6ef4] py-3 text-[18px] font-semibold text-white transition hover:bg-[#265ed2]"
            >
              {t("forgotPassword.submit")}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
