import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettingsProfilePage() {
  const { t } = useTranslation("common");
  const { token, user, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      return;
    }
    fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
        }
      })
      .catch(() => {});
  }, [token, router, user]);

  const onSave = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password: password.trim() ? password : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || t("settings.saveError"));
        return;
      }
      setPassword("");
      setMessage(t("settings.saved"));
      await refreshProfile();
    } catch {
      setError(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  return (
    <Layout title={t("settings.profile")}>
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl px-4 md:px-6 pb-[120px] md:pb-8 pt-4 md:pt-8">
        <div className="rounded-[28px] border border-[#d9e0eb] bg-white p-5 md:p-8 desktop-shell">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
            {t("settings.profile")}
          </h1>

          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-blue-50 text-2xl font-bold text-blue-700">
                {(name || user?.name || "U").trim().charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 p-3 text-base"
                placeholder={t("settings.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 p-3 text-base"
                placeholder={t("settings.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 p-3 text-base"
                placeholder={t("settings.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message ? (
              <p className="mt-3 text-sm text-green-700">{message}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? t("settings.saving") : t("settings.save")}
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
