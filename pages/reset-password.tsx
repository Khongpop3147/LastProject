"use client";
import { useState } from "react";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
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
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!token) {
      setError("Token ไม่ถูกต้อง");
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
      setError(data.error || "เกิดข้อผิดพลาด");
    }
  };

  if (success)
    return (
      <div className="max-w-md mx-auto mt-20 p-4 border rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-4">รีเซ็ตรหัสผ่านสำเร็จ</h2>
        <p>กำลังไปหน้าล็อกอิน...</p>
      </div>
    );

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">ตั้งรหัสผ่านใหม่</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="รหัสผ่านใหม่"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          placeholder="ยืนยันรหัสผ่านใหม่"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          ตั้งรหัสผ่านใหม่
        </button>
      </form>
    </div>
  );
}
