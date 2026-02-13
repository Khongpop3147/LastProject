// pages/admin/coupons.tsx
import { GetServerSideProps, NextPage } from "next";
import { useState, ChangeEvent, FormEvent } from "react";
import Layout from "@/components/AdminLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/adminGuard";

interface Coupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  usageLimit: number | null;
  expiresAt: string | null;
}

interface Props {
  initial: Coupon[];
}

const AdminCouponsPage: NextPage<Props> = ({ initial }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(initial);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent",
    discountValue: "",
    usageLimit: "",
    expiresAt: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...form });
  const [loading, setLoading] = useState(false);

  // --- Handlers for Create form ---
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addCoupon(e: FormEvent) {
    e.preventDefault();
    const code = form.code.trim();
    const discountValue = parseFloat(form.discountValue);
    const usageLimit = form.usageLimit
      ? parseInt(form.usageLimit, 10)
      : undefined;
    const expiresAt = form.expiresAt || undefined;

    if (!code || isNaN(discountValue) || discountValue <= 0) {
      alert("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountType: form.discountType,
        discountValue,
        usageLimit,
        expiresAt,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setCoupons((prev) => [
        {
          id: data.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          usageLimit: data.usageLimit,
          expiresAt: data.expiresAt ?? null,
        },
        ...prev,
      ]);
      setForm({ code: "", discountType: "percent", discountValue: "", usageLimit: "", expiresAt: "" });
    } else {
      alert("Error: " + (data.error || "ไม่สามารถเพิ่มคูปองได้"));
    }
  }

  // --- Handlers for Inline Edit/Delete ---
  function startEdit(c: Coupon) {
    setEditingId(c.id);
    setEditForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      usageLimit: c.usageLimit?.toString() ?? "",
      expiresAt: c.expiresAt?.slice(0, 10) ?? "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
  }

  function handleEditChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function saveEdit(id: string) {
    setLoading(true);
    const payload = {
      code: editForm.code.trim(),
      discountType: editForm.discountType,
      discountValue: parseFloat(editForm.discountValue),
      usageLimit: editForm.usageLimit ? parseInt(editForm.usageLimit, 10) : undefined,
      expiresAt: editForm.expiresAt || undefined,
    };
    const res = await fetch(`/api/admin/coupons?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                id: data.id,
                code: data.code,
                discountType: data.discountType,
                discountValue: data.discountValue,
                usageLimit: data.usageLimit,
                expiresAt: data.expiresAt ?? null,
              }
            : c
        )
      );
      setEditingId(null);
    } else {
      alert("Update failed: " + (data.error || "ไม่สำเร็จ"));
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("ลบคูปองนี้ใช่หรือไม่?")) return;
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    if (res.status === 204) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json();
      alert("Delete failed: " + (data.error || "ไม่สำเร็จ"));
    }
  }

  return (
    <Layout title="จัดการคูปอง (Admin)">
      <h1 className="text-3xl font-bold mb-4">จัดการคูปอง</h1>
      <Link href="/" className="text-blue-600 mb-6 block">&larr; กลับหน้าหลัก</Link>

      {/* -- Create Form -- */}
      <form onSubmit={addCoupon} className="space-y-4 mb-8 max-w-md">
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="รหัสคูปอง"
          className="border p-2 w-full rounded"
          required
        />
        <div className="flex gap-2">
          <select
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="border p-2 rounded flex-1"
          >
            <option value="percent">เปอร์เซ็นต์ (%)</option>
            <option value="fixed">จำนวนเงินคงที่</option>
          </select>
          <input
            name="discountValue"
            value={form.discountValue}
            onChange={handleChange}
            placeholder="มูลค่าส่วนลด"
            type="number"
            className="border p-2 rounded flex-1"
            required
          />
        </div>
        <input
          name="usageLimit"
          value={form.usageLimit}
          onChange={handleChange}
          placeholder="จำกัดการใช้ (ไม่บังคับ)"
          type="number"
          className="border p-2 w-full rounded"
        />
        <input
          name="expiresAt"
          value={form.expiresAt}
          onChange={handleChange}
          placeholder="วันหมดอายุ (ไม่บังคับ)"
          type="date"
          className="border p-2 w-full rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "เพิ่มคูปอง"}
        </button>
      </form>

      {/* -- Table / Inline Edit -- */}
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="grid grid-cols-6 gap-2 border p-3 rounded text-sm items-center">
            {editingId === c.id ? (
              <>
                <input
                  name="code"
                  value={editForm.code}
                  onChange={handleEditChange}
                  className="border p-1 rounded col-span-1"
                />
                <select
                  name="discountType"
                  value={editForm.discountType}
                  onChange={handleEditChange}
                  className="border p-1 rounded col-span-1"
                >
                  <option value="percent">%</option>
                  <option value="fixed">฿</option>
                </select>
                <input
                  name="discountValue"
                  type="number"
                  value={editForm.discountValue}
                  onChange={handleEditChange}
                  className="border p-1 rounded col-span-1"
                />
                <input
                  name="usageLimit"
                  type="number"
                  value={editForm.usageLimit}
                  onChange={handleEditChange}
                  className="border p-1 rounded col-span-1"
                />
                <input
                  name="expiresAt"
                  type="date"
                  value={editForm.expiresAt}
                  onChange={handleEditChange}
                  className="border p-1 rounded col-span-1"
                />
                <div className="col-span-1 flex space-x-1">
                  <button
                    onClick={() => saveEdit(c.id)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-2 rounded disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                  <button onClick={cancelEdit} className="bg-gray-300 px-2 rounded">
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="col-span-1 font-medium">{c.code}</span>
                <span className="col-span-1">
                  {c.discountType === "percent"
                    ? `${c.discountValue}%`
                    : `${c.discountValue} ฿`}
                </span>
                <span className="col-span-1">{c.usageLimit ?? "-"}</span>
                <span className="col-span-2">
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString("en-GB")
                    : "-"}
                </span>
                <div className="col-span-1 flex space-x-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-blue-600 px-2 rounded border"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="text-red-600 px-2 rounded border"
                  >
                    ลบ
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AdminCouponsPage;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) =>
  adminGuard<Props>(ctx, async () => {
    const raw = await prisma.coupon.findMany({ orderBy: { id: "desc" } });
    const initial: Coupon[] = raw.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType as "percent" | "fixed",
      discountValue: c.discountValue,
      usageLimit: c.usageLimit,
      expiresAt: c.expiresAt?.toISOString() ?? null,
    }));
    return { props: { initial } };
  });
