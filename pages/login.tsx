// pages/login.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
    agree: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await login(form.email, form.password, form.remember);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ตัว Container หลัก: ใช้ min-h-screen และ bg-white เพื่อให้เต็มจอสีขาวแบบ App
    // หรือถ้าอยากได้พื้นหลังดำแล้วมีการ์ดขาวตรงกลาง ให้เปลี่ยน bg-white เป็น bg-gray-900 แล้วเพิ่ม flex items-center justify-center
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9F5] p-4">
      {/* bg-[#F5F9F5] คือสีขาวอมเขียวอ่อนๆ ตามสไตล์รูปตัวอย่าง หรือใช้ bg-white ก็ได้ */}

      <div className="w-full max-w-md bg-white rounded-[30px] p-8 shadow-sm border border-gray-100 relative">
        {/* Header "sing up" แบบในรูป (อยู่นอกกรอบ หรือ มุมบน) */}
        <div className="mb-10 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <h4 className="text-2xl font-bold text-gray-800 normal-case">
            sing in
          </h4>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <input
              name="email"
              type="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={onChange}
              required
              className="peer w-full h-14 px-4 border border-gray-400 rounded-xl focus:outline-none focus:border-blue-600 text-gray-700 placeholder-gray-300 bg-transparent"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-focus:text-blue-600">
              Email
            </label>
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              name="password"
              type="password"
              placeholder="Enter Full Name" // ตามรูปตัวอย่าง placeholder เป็น Enter Full Name (แต่น่าจะเป็น Password)
              value={form.password}
              onChange={onChange}
              required
              className="peer w-full h-14 px-4 border border-gray-400 rounded-xl focus:outline-none focus:border-blue-600 text-gray-700 placeholder-gray-300 bg-transparent"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-focus:text-blue-600">
              Password
            </label>
          </div>

          {/* Checkbox */}
          <div className="flex items-center space-x-3 mt-2">
            <input
              type="checkbox"
              name="agree"
              id="agree"
              checked={form.agree}
              onChange={onChange}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="agree" className="text-sm text-gray-600">
              I agree to the processing of{" "}
              <Link
                href="/privacy-policy"
                className="text-blue-600 hover:underline"
              >
                Personal data
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#3B71CA] text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-md text-lg mt-4 disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-500 bg-white">
            Sign in with
          </span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Social Login Buttons - ไอคอนใหญ่ขึ้น */}
        <div className="flex justify-center gap-8 mb-6">
          {/* Google */}
          <button className="transform hover:scale-110 transition duration-200">
            <svg className="w-12 h-12" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>

          <button className="transform hover:scale-110 transition duration-200">
            <img src="/images/line.png" alt="LINE" className="w-12 h-12" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          Don’t have an account?{" "}
          <Link
            href="/login"
            className="text-blue-500 font-medium hover:underline"
          >
            Sing up
          </Link>
        </div>
      </div>
    </div>
  );
}
