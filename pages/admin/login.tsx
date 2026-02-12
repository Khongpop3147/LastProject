"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      setWelcome(true); // แสดงข้อความต้อนรับ
      // รอ 1.5 วินาที ก่อน redirect
      setTimeout(() => {
        router.push("/admin/home-manage");
      }, 1500);
    } else {
      const err = await res.json();
      setError(err.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-24 h-24 text-blue-600"
            fill="none"
            viewBox="0 0 48 48"
            stroke="currentColor"
            strokeWidth={2}
          >
            {/* รูปแบบโลโก้ในภาพ */}
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="3" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M30 12c-2 2-4 4-6 6-2 2-4 4-6 6"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M24 24l12 12"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold mb-8">Welcome back!</h2>

        {welcome ? (
          <p className="text-center text-green-600 text-xl font-semibold">
            Welcome, Admin!
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-left font-semibold mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-left font-semibold mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Use at least 8 characters with 1 number, and one special character.
              </p>
            </div>

            {error && (
              <p className="text-red-600 text-center font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } font-semibold transition`}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "LOG IN"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-sm text-gray-500 hover:underline"
            onClick={(e) => e.preventDefault()}
          >
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
