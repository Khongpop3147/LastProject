// pages/register.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
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

    if (!form.agree) {
      setError("กรุณายอมรับเงื่อนไขการใช้งาน");
      return;
    }
    if (form.password !== form.confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Layout title="Register">
      <div className="flex h-screen">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              Register your account
            </h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm mb-1">Username</label>
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    placeholder="QweryDesign"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="w-full border rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <User size={20} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm mb-1">Email Address</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    placeholder="alex@email.com"
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

              {/* Password */}
              <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirm"
                    type="password"
                    placeholder="Re-enter your password"
                    value={form.confirm}
                    onChange={onChange}
                    required
                    className="w-full border rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                    <Lock size={20} />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center text-sm">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={onChange}
                  className="h-4 w-4 mr-2"
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/terms")}
                    className="text-blue-600 hover:underline"
                  >
                    terms of service
                  </button>
                  .
                </span>
              </div>

              {/* Register */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition"
              >
                Register
              </button>
            </form>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="hidden md:block w-1/2 relative">
          <Image
            src="/images/1.png"
            alt="Register Illustration"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Layout>
  );
}
