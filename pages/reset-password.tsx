"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

export default function ResetPasswordPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token =
    typeof router.query.token === "string"
      ? router.query.token
      : Array.isArray(router.query.token)
        ? router.query.token[0] || ""
        : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }
    if (!token) {
      setError(t("resetPassword.invalidToken"));
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      const data = await res.json();
      setError(data.error || t("resetPassword.errorGeneric"));
    }
  };

  if (success)
    return (
      <div className="min-h-screen desktop-page bg-[#f3f3f4]">
        <div className="mx-auto w-full max-w-md desktop-shell p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("resetPassword.successHeading")}
          </h2>
          <p>{t("resetPassword.redirecting")}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen desktop-page bg-[#f3f3f4]">
      <div className="mx-auto w-full max-w-md desktop-shell p-6">
        <h1 className="text-2xl font-bold mb-4">
          {t("resetPassword.heading")}
        </h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            placeholder={t("resetPassword.newPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder={t("resetPassword.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {t("resetPassword.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
