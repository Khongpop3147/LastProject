"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <Layout title={t("auth.login.pageTitle")}>
      <div className="flex h-screen">
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              {t("auth.login.heading")}
            </h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-1">{t("auth.fields.emailLabel")}</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    placeholder={t("auth.fields.emailPlaceholder")}
                    value={form.email}
                    onChange={onChange}
                    required
                    className="w-full border rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <Mail size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">{t("auth.fields.passwordLabel")}</label>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    placeholder={t("auth.fields.passwordPlaceholder")}
                    value={form.password}
                    onChange={onChange}
                    required
                    className="w-full border rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <Lock size={20} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-6">
                <label className="flex items-center space-x-2">
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
                  className="text-blue-600 hover:underline"
                >
                  {t("auth.login.forgotPassword")}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition"
              >
                {t("auth.login.submit")}
              </button>
            </form>

            <div className="flex items-center my-6 w-full">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">
                {t("auth.login.continueWith")}
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={() => console.log("Line Login")}
                className="w-12 h-12 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
              >
                <Image
                  src="/images/line.png"
                  alt="Line Login"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-lg"
                />
              </button>
            </div>

            <button
              onClick={() => router.push("/register")}
              className="w-full border-2 border-blue-600 text-blue-600 py-2 rounded-full hover:bg-blue-50 transition"
            >
              {t("auth.login.signUpNow")}
            </button>
          </div>
        </div>

        <div className="hidden md:block w-1/2 relative">
          <Image
            src="/images/image.png"
            alt="Login Illustration"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Layout>
  );
}
