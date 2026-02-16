"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Layout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";

interface Supplier {
  id: string;
  companyName: string;
  productName: string;
  stock: number;
  unitPrice: number;
  lineId?: string | null;
}

export default function AdminSuppliersPage() {
  const { token, adminLogout } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    productName: "",
    stock: "",
    unitPrice: "",
    lineId: "",
  });
  const [loading, setLoading] = useState(false);

  // สำหรับแก้ไข
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: "",
    productName: "",
    stock: "",
    unitPrice: "",
    lineId: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/admin/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        setSuppliers(await res.json());
      } else if (res.status === 401) {
        adminLogout();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function createSupplier() {
    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName,
        productName: form.productName,
        stock: Number(form.stock),
        unitPrice: Number(form.unitPrice),
        lineId: form.lineId || null,
      };
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setForm({ companyName: "", productName: "", stock: "", unitPrice: "", lineId: "" });
        fetchSuppliers();
      } else {
        alert("สร้างไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(s: Supplier) {
    setEditSupplier(s);
    setEditForm({
      companyName: s.companyName,
      productName: s.productName,
      stock: String(s.stock),
      unitPrice: String(s.unitPrice),
      lineId: s.lineId || "",
    });
  }
  function closeEditModal() {
    setEditSupplier(null);
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editSupplier) return;
    try {
      const payload = {
        companyName: editForm.companyName,
        productName: editForm.productName,
        stock: Number(editForm.stock),
        unitPrice: Number(editForm.unitPrice),
        lineId: editForm.lineId || null,
      };
      const res = await fetch(`/api/admin/suppliers/${editSupplier.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeEditModal();
        fetchSuppliers();
      } else {
        alert("อัปเดตไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  }

  async function deleteSupplier(id: string) {
    if (!confirm("ลบ Supplier รายการนี้?")) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.status === 204) fetchSuppliers();
      else alert("ลบไม่สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  }

  return (
    <Layout title="จัดการ Suppliers">
      <h1 className="text-2xl font-bold mb-4">จัดการ Suppliers</h1>

      {/* สร้างใหม่ */}
      <div className="mb-6 space-y-4 max-w-md">
        <div>
          <label className="block mb-1 font-medium">ชื่อบริษัทผู้จำหน่าย</label>
          <input
            type="text"
            placeholder="..."
            value={form.companyName}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyName: e.target.value }))
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">ชื่อสินค้า</label>
          <input
            type="text"
            placeholder="ไก่ต้มผัดซอส"
            value={form.productName}
            onChange={(e) =>
              setForm((f) => ({ ...f, productName: e.target.value }))
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block mb-1 font-medium">
              จำนวนที่สั่ง (ชิ้น)
            </label>
            <input
              type="number"
              placeholder=""
              value={form.stock}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="w-1/2">
            <label className="block mb-1 font-medium">
              ราคาต่อหน่วย (฿)
            </label>
            <input
              type="number"
              placeholder=""
              value={form.unitPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, unitPrice: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">LINE ID (เช่น @yourline)</label>
          <input
            type="text"
            placeholder="@yourline"
            value={form.lineId}
            onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          onClick={createSupplier}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "กำลังสร้าง..." : "เพิ่ม Supplier"}
        </button>
      </div>

      {/* รายการ */}
      <ul className="space-y-2">
        {suppliers.map((s) => (
          <li
            key={s.id}
            className="flex justify-between border p-4 rounded bg-white shadow"
          >
            <div className="space-y-1">
              <p>
                <span className="font-semibold">สินค้า:</span> {s.productName}
              </p>
              <p>
                <span className="font-semibold">ผู้จำหน่าย:</span>{" "}
                {s.companyName}
              </p>
              <p>
                <span className="font-semibold">จำนวนที่สั่ง:</span> {s.stock} ชิ้น
              </p>
              <p>
                <span className="font-semibold">ราคาต่อหน่วย:</span>{" "}
                {s.unitPrice} ฿
              </p>
              {s.lineId ? (
                <p>
                  <span className="font-semibold">LINE:</span>{" "}
                  <a
                    href={`https://line.me/R/ti/p/${encodeURIComponent(
                      s.lineId
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00b900] underline"
                  >
                    {s.lineId}
                  </a>
                </p>
              ) : null}
              <p className="pt-1 text-right font-bold">
                <span className="font-semibold">ราคารวม:</span>{" "}
                {s.stock * s.unitPrice} ฿
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => openEditModal(s)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                แก้ไข
              </button>
              <button
                onClick={() => deleteSupplier(s.id)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                ลบ
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* โมดัลแก้ไข */}
      {editSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">แก้ไข Supplier</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">
                  ชื่อบริษัทผู้จำหน่าย
                </label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      companyName: e.target.value,
                    }))
                  }
                  required
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">LINE ID (เช่น @yourline)</label>
                <input
                  type="text"
                  value={editForm.lineId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lineId: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      productName: e.target.value,
                    }))
                  }
                  required
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium">
                    จำนวนที่สั่ง (ชิ้น)
                  </label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        stock: e.target.value,
                      }))
                    }
                    required
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium">
                    ราคาต่อหน่วย (฿)
                  </label>
                  <input
                    type="number"
                    value={editForm.unitPrice}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        unitPrice: e.target.value,
                      }))
                    }
                    required
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
