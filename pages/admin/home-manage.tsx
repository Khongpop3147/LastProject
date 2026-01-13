"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Layout from "@/components/AdminLayout"; // ใช้ layout ที่คุณมี
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { GetServerSideProps } from "next";
import { adminGuard } from "@/lib/adminGuard";

interface Category {
  id: string;
  name: string;
}

interface Banner {
  id: string;
  titleTh: string;
  titleEn: string;
  subTh: string | null;
  subEn: string | null;
  imageUrl: string;
  order: number;
  position: string;
  descriptionTh: string | null;
  descriptionEn: string | null;
}

interface Product {
  id: string;
  nameTh: string;
  nameEn: string;
  descTh?: string;
  descEn?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  categoryId?: string;
  imageUrl?: string | null;
  isFeatured: boolean;
}

interface SubBannerForm {
  // title สองภาษา
  titleTh: string;
  titleEn: string;
  // description สองภาษา
  descriptionTh: string;
  descriptionEn: string;
  // buttonText สองภาษา
  buttonTextTh: string;
  buttonTextEn: string;
  buttonLink: string;
  imageUrl: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  adminGuard(ctx, async () => ({ props: {} }));

export default function HomeManagePage() {
  const [tab, setTab] = useState<
    "product" | "category" | "banner" | "subbanner"
  >("product");
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <Layout title="จัดการหน้าโฮม">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8 border-b border-gray-300 pb-4">
        จัดการหน้าโฮม
      </h1>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <nav className="flex space-x-4">
          {[
            { key: "product", label: "สร้างสินค้า" },
            { key: "category", label: "จัดการหมวดหมู่" },
            { key: "banner", label: "จัดการแบนเนอร์" },
            { key: "subbanner", label: "แก้ไข Sub-Banner" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-5 py-2 rounded-md font-medium ${
                tab === key
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Add button (เหมือนในรูปแบนเนอร์ มีปุ่ม Add) */}
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow p-8 max-w-full overflow-x-auto">
        {tab === "product" && (
          <>
            <CreateProductSection />
            <hr className="my-8 border-gray-200" />
            <ManageProductSection />
          </>
        )}
        {tab === "category" && <ManageCategorySection />}
        {tab === "banner" && <ManageBannerSection />}
        {tab === "subbanner" && <ManageSubBannerSection />}
      </div>

      {/* Footer / User info */}
    </Layout>
  );
}

// --- Create Product Section ---
function CreateProductSection() {
  // โค้ดยังคงเหมือนเดิม
  // ใส่ max width และ spacing ให้ดูดีตามดีไซน์
  // ... ใช้โค้ดเดิมของคุณ
  // เพิ่ม div ห่อ form ด้วย className="max-w-xl"
  const [form, setForm] = useState({
    nameTh: "",
    nameEn: "",
    descTh: "",
    descEn: "",
    price: "",
    salePrice: "",
    stock: "",
    categoryId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // ดึงหมวดหมู่ภาษาไทย (หรือใช้ locale param ตามต้องการ)
    fetch("/api/categories?locale=th")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "image" && files) {
      setFile(files[0]);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const {
      nameTh,
      nameEn,
      descTh,
      descEn,
      price,
      salePrice,
      stock,
      categoryId,
    } = form;

    if (!nameTh.trim() || !nameEn.trim()) {
      return alert("กรุณากรอกชื่อสินค้า ทั้งสองภาษา");
    }

    const data = new FormData();
    data.append("nameTh", nameTh);
    data.append("nameEn", nameEn);
    data.append("descTh", descTh);
    data.append("descEn", descEn);
    data.append("price", price);
    if (salePrice) data.append("salePrice", salePrice);
    data.append("stock", stock);
    if (categoryId) data.append("categoryId", categoryId);
    if (file) data.append("image", file);

    const res = await fetch("/api/products", {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Error creating product");
    } else {
      alert("Created!");
      setForm({
        nameTh: "",
        nameEn: "",
        descTh: "",
        descEn: "",
        price: "",
        salePrice: "",
        stock: "",
        categoryId: "",
      });
      setFile(null);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-6">
        สร้างสินค้าใหม่ / Create New Product
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          name="nameTh"
          value={form.nameTh}
          onChange={onChange}
          placeholder="ชื่อสินค้า (ภาษาไทย)"
          required
          className="w-full border rounded p-3"
        />
        <input
          name="nameEn"
          value={form.nameEn}
          onChange={onChange}
          placeholder="Product Name (EN)"
          required
          className="w-full border rounded p-3"
        />
        <textarea
          name="descTh"
          value={form.descTh}
          onChange={onChange}
          placeholder="รายละเอียด (ภาษาไทย)"
          className="w-full border rounded p-3"
        />
        <textarea
          name="descEn"
          value={form.descEn}
          onChange={onChange}
          placeholder="Description (EN)"
          className="w-full border rounded p-3"
        />
        <input
          name="price"
          type="number"
          value={form.price}
          onChange={onChange}
          placeholder="ราคา"
          required
          className="w-full border rounded p-3"
        />
        <input
          name="salePrice"
          type="number"
          value={form.salePrice}
          onChange={onChange}
          placeholder="ราคาลด (ถ้ามี)"
          className="w-full border rounded p-3"
        />
        <input
          name="stock"
          type="number"
          value={form.stock}
          onChange={onChange}
          placeholder="จำนวนสต็อก"
          required
          className="w-full border rounded p-3"
        />
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={onChange}
          className="w-full border rounded p-3"
        >
          <option value="">-- เลือกหมวดหมู่ --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onChange}
          className="w-full border rounded p-3"
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-5 py-3 hover:bg-green-700 transition"
        >
          บันทึก / Save
        </button>
      </form>
    </div>
  );
}
// --- Manage Product Section ---

function ManageProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // popup แก้ไข
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    nameTh: "",
    nameEn: "",
    descTh: "",
    descEn: "",
    price: "",
    salePrice: "",
    stock: "",
    categoryId: "", // เลือกจาก list
  });
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    // โหลดสินค้า
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.items || data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // โหลดหมวดหมู่
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.items || data))
      .catch(console.error);
  }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    setLoadingId(id);
    const res = await fetch(`/api/products/${id}/feature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    if (res.ok) {
      setProducts((p) =>
        p.map((x) => (x.id === id ? { ...x, isFeatured: !current } : x))
      );
    } else {
      alert("อัปเดตสถานะสินค้าไม่สำเร็จ");
    }
    setLoadingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("ลบสินค้านี้หรือไม่?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      setProducts((p) => p.filter((x) => x.id !== id));
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "ไม่สามารถลบได้"));
    }
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditForm({
      // แทนที่ name/description เดิมด้วย nameTh/nameEn/descTh/descEn
      nameTh: product.nameTh,
      nameEn: product.nameEn,
      descTh: product.descTh || "",
      descEn: product.descEn || "",

      price: product.price.toString(),
      salePrice: product.salePrice?.toString() || "",
      stock: product.stock.toString(),
      categoryId: product.categoryId || "",
    });
    setEditFile(null);
  };

  const closeEditModal = () => {
    setEditProduct(null);
    setEditFile(null);
  };

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "image" && files) {
      setEditFile(files[0]);
    } else {
      setEditForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const fd = new FormData();
    // แทนที่ fd.append("name", editForm.name)
    fd.append("nameTh", editForm.nameTh);
    fd.append("nameEn", editForm.nameEn);
    // แทนที่ fd.append("description", editForm.description)
    fd.append("descTh", editForm.descTh);
    fd.append("descEn", editForm.descEn);
    fd.append("price", editForm.price);
    fd.append("salePrice", editForm.salePrice);
    fd.append("stock", editForm.stock);
    fd.append("categoryId", editForm.categoryId); // ส่ง id ที่เลือกมา
    if (editFile) fd.append("image", editFile);

    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: "PUT",
      body: fd,
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProducts((p) =>
        p.map((item) => (item.id === updated.id ? updated : item))
      );
      closeEditModal();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "แก้ไขสินค้าไม่สำเร็จ"));
    }
  };

  if (loading) return <p>กำลังโหลดสินค้า...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">จัดการสินค้า</h2>
      {products.length === 0 ? (
        <p>ยังไม่มีสินค้า</p>
      ) : (
        <table className="w-full table-auto border-collapse border border-gray-200 rounded shadow bg-white">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="border px-6 py-3 w-12">#</th>
              <th className="border px-6 py-3">ชื่อสินค้า (TH)</th>
              <th className="border px-6 py-3">Product Name (EN)</th>
              <th className="border px-6 py-3">รายละเอียด (TH)</th>
              <th className="border px-6 py-3">Description (EN)</th>
              <th className="border px-6 py-3">ราคา</th>
              <th className="border px-6 py-3">Stock</th>
              <th className="border px-6 py-3 text-center">แนะนำ</th>
              <th className="border px-6 py-3 text-center">รูปสินค้า</th>
              <th className="border px-6 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border hover:bg-gray-50">
                <td className="border px-6 py-3">{i + 1}</td>
                <td className="border px-6 py-3">{p.nameTh}</td>
                <td className="border px-6 py-3">{p.nameEn}</td>
                <td className="border px-6 py-3">{p.descTh || "-"}</td>
                <td className="border px-6 py-3">{p.descEn || "-"}</td>
                <td className="border px-6 py-3">
                  {p.salePrice != null ? (
                    <>
                      <span className="line-through text-gray-400 mr-2">
                        ฿{p.price}
                      </span>
                      <span className="text-red-600 font-bold">
                        ฿{p.salePrice}
                      </span>
                    </>
                  ) : (
                    <span className="text-green-600">฿{p.price}</span>
                  )}
                </td>
                <td className="border px-6 py-3">{p.stock}</td>
                <td className="border px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={p.isFeatured}
                    disabled={loadingId === p.id}
                    onChange={() => toggleFeatured(p.id, p.isFeatured)}
                  />
                </td>
                <td className="border px-6 py-3 text-center">
                  <img
                    src={p.imageUrl || "/images/placeholder.png"}
                    alt={p.nameTh}
                    className="h-12 w-12 object-cover rounded"
                  />
                </td>
                <td className="border px-6 py-3 text-center">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => openEditModal(p)}
                      className="text-blue-600 hover:underline"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-lg overflow-auto p-6">
            <h3 className="text-xl mb-4">แก้ไขสินค้า</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block">
                รูปภาพ (อัปโหลดใหม่ถ้าต้องการ)
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleEditChange}
                  className="mt-1"
                />
              </label>
              <label className="block">
                ชื่อสินค้า (TH):
                <input
                  type="text"
                  name="nameTh"
                  value={editForm.nameTh}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Product Name (EN):
                <input
                  type="text"
                  name="nameEn"
                  value={editForm.nameEn}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                รายละเอียด (TH):
                <textarea
                  name="descTh"
                  value={editForm.descTh}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Description (EN):
                <textarea
                  name="descEn"
                  value={editForm.descEn}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                ราคา:
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                ราคาลด (ไม่บังคับ):
                <input
                  type="number"
                  name="salePrice"
                  value={editForm.salePrice}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                สต็อก:
                <input
                  type="number"
                  name="stock"
                  value={editForm.stock}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                หมวดหมู่:
                <select
                  name="categoryId"
                  value={editForm.categoryId}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageCategorySection() {
  const [cats, setCats] = useState<Category[]>([]);
  const [newNameTh, setNewNameTh] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [locale, setLocale] = useState<"th" | "en">("th");

  useEffect(() => {
    fetch(`/api/categories?locale=${locale}`)
      .then((r) => r.json())
      .then((data: Category[]) => setCats(data))
      .catch(console.error);
  }, [locale]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNameTh.trim() || !newNameEn.trim()) {
      return alert(
        locale === "th"
          ? "กรุณากรอกชื่อทั้งสองภาษา"
          : "Please enter both Thai and English names"
      );
    }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameTh: newNameTh, nameEn: newNameEn }),
    });

    if (res.ok) {
      const { id, nameTh, nameEn } = (await res.json()) as {
        id: string;
        nameTh: string;
        nameEn: string;
      };
      const name = locale === "th" ? nameTh : nameEn;
      setCats((prev) => [...prev, { id, name }]);
      setNewNameTh("");
      setNewNameEn("");
    } else {
      const { error } = await res.json();
      alert(error || (locale === "th" ? "เกิดข้อผิดพลาด" : "Error occurred"));
    }
  };

  const remove = async (id: string) => {
    if (!confirm(locale === "th" ? "ลบไหม?" : "Are you sure?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      setCats((c) => c.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="max-w-xl">
      {/* Language selector */}
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium">
          {locale === "th" ? "ภาษา:" : "Language:"}
        </label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as "th" | "en")}
          className="border rounded p-2"
        >
          <option value="th">ไทย</option>
          <option value="en">EN</option>
        </select>
      </div>

      <h2 className="text-2xl font-semibold mb-6">
        {locale === "th" ? "จัดการหมวดหมู่" : "Manage Categories"}
      </h2>

      {/* Add form with two inputs */}
      <form onSubmit={add} className="flex flex-col gap-3 mb-6">
        <input
          value={newNameTh}
          onChange={(e) => setNewNameTh(e.target.value)}
          placeholder={
            locale === "th" ? "ชื่อหมวดหมู่ (ภาษาไทย)" : "Category Name (TH)"
          }
          className="border p-3 rounded"
        />
        <input
          value={newNameEn}
          onChange={(e) => setNewNameEn(e.target.value)}
          placeholder={
            locale === "th" ? "ชื่อหมวดหมู่ (ภาษาอังกฤษ)" : "Category Name (EN)"
          }
          className="border p-3 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-6 py-3 hover:bg-green-700"
        >
          {locale === "th" ? "เพิ่ม" : "Add"}
        </button>
      </form>

      {/* Categories table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">
              {locale === "th" ? "ชื่อหมวดหมู่" : "Category Name"}
            </th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => remove(c.id)}
                  className="text-red-600 hover:underline"
                >
                  {locale === "th" ? "ลบ" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManageSubBannerSection() {
  const [form, setForm] = useState<SubBannerForm>({
    titleTh: "",
    titleEn: "",
    descriptionTh: "",
    descriptionEn: "",
    buttonTextTh: "",
    buttonTextEn: "",
    buttonLink: "",
    imageUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // โหลดข้อมูลเริ่มต้นพร้อมตั้ง previewUrl
  useEffect(() => {
    fetch("/api/subbanner")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          titleTh: data.titleTh || "",
          titleEn: data.titleEn || "",
          descriptionTh: data.descriptionTh || "",
          descriptionEn: data.descriptionEn || "",
          buttonTextTh: data.buttonTextTh || "",
          buttonTextEn: data.buttonTextEn || "",
          buttonLink: data.buttonLink || "",
          imageUrl: data.imageUrl || "",
        });
        if (data.imageUrl) setPreviewUrl(data.imageUrl);
      })
      .catch(console.error);
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let imageUrl = form.imageUrl;

    // ถ้ามีไฟล์ ให้ upload แล้วรับ URL มา
    if (file) {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        imageUrl = url;
      } else {
        console.error("Upload failed");
      }
    }

    // อัปเดต SubBanner
    const res = await fetch("/api/subbanner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imageUrl }),
    });

    if (res.ok) {
      alert("อัปเดต Sub-Banner เรียบร้อย");
    } else {
      console.error(await res.text());
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">แก้ไข Sub-Banner</h2>

      {/* Preview */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-1">Preview Background</div>
        <div
          className="w-full h-32 rounded-xl bg-center bg-cover border"
          style={{
            backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
          }}
        />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <input
          name="titleTh"
          value={form.titleTh}
          onChange={onChange}
          placeholder="Title (TH)"
          className="w-full border p-2 rounded"
        />
        <input
          name="titleEn"
          value={form.titleEn}
          onChange={onChange}
          placeholder="Title (EN)"
          className="w-full border p-2 rounded"
        />

        {/* Description */}
        <textarea
          name="descriptionTh"
          value={form.descriptionTh}
          onChange={onChange}
          placeholder="Description (TH)"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="descriptionEn"
          value={form.descriptionEn}
          onChange={onChange}
          placeholder="Description (EN)"
          className="w-full border p-2 rounded"
        />

        {/* Button Text */}
        <input
          name="buttonTextTh"
          value={form.buttonTextTh}
          onChange={onChange}
          placeholder="Button Text (TH)"
          className="w-full border p-2 rounded"
        />
        <input
          name="buttonTextEn"
          value={form.buttonTextEn}
          onChange={onChange}
          placeholder="Button Text (EN)"
          className="w-full border p-2 rounded"
        />

        {/* Button Link (single) */}
        <input
          name="buttonLink"
          value={form.buttonLink}
          onChange={onChange}
          placeholder="Button Link"
          className="w-full border p-2 rounded"
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            เลือกรูปภาพพื้นหลัง
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          บันทึก
        </button>
      </form>
    </div>
  );
}

// --- Manage Banner Section ---
export function ManageBannerSection() {
  const [items, setItems] = useState<Banner[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<{
    titleTh: string;
    titleEn: string;
    subTh: string;
    subEn: string;
    descriptionTh: string;
    descriptionEn: string;
    order: number;
    position: string;
  }>({
    titleTh: "",
    titleEn: "",
    subTh: "",
    subEn: "",
    descriptionTh: "",
    descriptionEn: "",
    order: 0,
    position: "hero",
  });

  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [editForm, setEditForm] = useState<{
    titleTh: string;
    titleEn: string;
    subTh: string;
    subEn: string;
    descriptionTh: string;
    descriptionEn: string;
    order: number;
    position: string;
  }>({
    titleTh: "",
    titleEn: "",
    subTh: "",
    subEn: "",
    descriptionTh: "",
    descriptionEn: "",
    order: 0,
    position: "hero",
  });
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => setItems(data.items || data))
      .catch(console.error);
  }, []);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "image" && files) {
      setFile(files[0]);
    } else {
      setForm((f) => ({
        ...f,
        [name]: name === "order" ? Number(value) : value,
      }));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return alert("กรุณาเลือกไฟล์รูปก่อน");

    const fd = new FormData();
    // แก้ตรงนี้ → append สองภาษา
    fd.append("titleTh", form.titleTh);
    fd.append("titleEn", form.titleEn);
    fd.append("subTh", form.subTh);
    fd.append("subEn", form.subEn);
    fd.append("descriptionTh", form.descriptionTh);
    fd.append("descriptionEn", form.descriptionEn);
    fd.append("order", String(form.order));
    fd.append("position", form.position);
    fd.append("image", file);

    const res = await fetch("/api/banners", { method: "POST", body: fd });
    if (res.ok) {
      const newBanner: Banner = await res.json();
      setItems((prev) => [...prev, newBanner]);
      // เคลียร์ form ให้ตรงกับฟิลด์ใหม่
      setForm({
        titleTh: "",
        titleEn: "",
        subTh: "",
        subEn: "",
        descriptionTh: "",
        descriptionEn: "",
        order: 0,
        position: "hero",
      });
      setFile(null);
    } else {
      const err = await res.json();
      alert(err.error || "Error creating banner");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ต้องการลบแบนเนอร์นี้หรือไม่?")) return;
    const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      setItems((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert("Error deleting banner");
    }
  };

  const openEditModal = (b: Banner) => {
    setEditBanner(b);
    setEditForm({
      titleTh: b.titleTh,
      titleEn: b.titleEn,
      subTh: b.subTh ?? "",
      subEn: b.subEn ?? "",
      descriptionTh: b.descriptionTh ?? "",
      descriptionEn: b.descriptionEn ?? "",
      order: b.order,
      position: b.position,
    });
    setEditFile(null);
  };

  const closeEditModal = () => setEditBanner(null);

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "image" && files) {
      setEditFile(files[0]);
    } else {
      setEditForm((f) => ({
        ...f,
        [name]: name === "order" ? Number(value) : value,
      }));
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editBanner) return;

    const fd = new FormData();
    // ส่งข้อมูลภาษาไทย–อังกฤษ แทน title/sub/description เดิม
    fd.append("titleTh", editForm.titleTh);
    fd.append("titleEn", editForm.titleEn);
    fd.append("subTh", editForm.subTh);
    fd.append("subEn", editForm.subEn);
    fd.append("descriptionTh", editForm.descriptionTh);
    fd.append("descriptionEn", editForm.descriptionEn);
    fd.append("order", String(editForm.order));
    fd.append("position", editForm.position);
    if (editFile) fd.append("image", editFile);

    const res = await fetch(`/api/banners/${editBanner.id}`, {
      method: "PUT",
      body: fd,
    });

    if (res.ok) {
      const updated: Banner = await res.json();
      setItems((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      closeEditModal();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "แก้ไขแบนเนอร์ไม่สำเร็จ"));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">จัดการแบนเนอร์</h2>

      <form onSubmit={onSubmit} className="space-y-5 mb-6 max-w-xl">
        <input
          name="titleTh"
          value={form.titleTh}
          onChange={onChange}
          placeholder="Title (TH)"
          className="w-full border rounded p-3"
        />
        <input
          name="titleEn"
          value={form.titleEn}
          onChange={onChange}
          placeholder="Title (EN)"
          className="w-full border rounded p-3"
        />
        <input
          name="subTh"
          value={form.subTh}
          onChange={onChange}
          placeholder="Sub (TH)"
          className="w-full border rounded p-3"
        />
        <input
          name="subEn"
          value={form.subEn}
          onChange={onChange}
          placeholder="Sub (EN)"
          className="w-full border rounded p-3"
        />
        <textarea
          name="descriptionTh"
          value={form.descriptionTh}
          onChange={onChange}
          placeholder="Description (TH)"
          className="w-full border rounded p-3 h-24"
        />
        <textarea
          name="descriptionEn"
          value={form.descriptionEn}
          onChange={onChange}
          placeholder="Description (EN)"
          className="w-full border rounded p-3 h-24"
        />
        <input
          name="order"
          type="number"
          value={form.order}
          onChange={onChange}
          placeholder="Order"
          className="w-full border rounded p-3"
        />
        <label className="block">
          Position:
          <select
            name="position"
            value={form.position}
            onChange={onChange}
            className="w-full border rounded p-3 mt-1"
          >
            <option value="hero">Hero</option>
            <option value="sub">Sub</option>
          </select>
        </label>
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onChange}
          className="w-full border rounded p-3"
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-6 py-3 hover:bg-green-700 transition"
        >
          สร้าง/อัปโหลดแบนเนอร์
        </button>
      </form>

      <table className="w-full table-auto border-collapse border border-gray-200 bg-white rounded shadow-md">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border px-4 py-3 w-12">#</th>
            <th className="border px-4 py-3">Title (TH)</th>
            <th className="border px-4 py-3">Title (EN)</th>
            <th className="border px-4 py-3">Sub (TH)</th>
            <th className="border px-4 py-3">Sub (EN)</th>
            <th className="border px-4 py-3">Description (TH)</th>
            <th className="border px-4 py-3">Description (EN)</th>
            <th className="border px-4 py-3">Banner</th>
            <th className="border px-4 py-3">Position</th>
            <th className="border px-4 py-3 w-40 text-center">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b, i) => (
            <tr key={b.id} className="border hover:bg-gray-50">
              <td className="border px-4 py-4">{i + 1}</td>
              <td className="border px-4 py-4">{b.titleTh || "-"}</td>
              <td className="border px-4 py-4">{b.titleEn || "-"}</td>
              <td className="border px-4 py-4">{b.subTh || "-"}</td>
              <td className="border px-4 py-4">{b.subEn || "-"}</td>
              <td className="border px-4 py-4">{b.descriptionTh || "-"}</td>
              <td className="border px-4 py-4">{b.descriptionEn || "-"}</td>
              <td className="border px-4 py-2">
                <img
                  src={b.imageUrl}
                  alt={b.titleTh || ""}
                  className="h-16 rounded object-cover"
                />
              </td>
              <td className="border px-4 py-4">{b.position}</td>
              <td className="border px-4 py-4 text-center space-x-4">
                <button
                  onClick={() => openEditModal(b)}
                  className="text-blue-600 hover:underline"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(b.id)}
                  className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700"
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              แก้ไขแบนเนอร์ / Edit Banner
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block">
                Title (TH):
                <input
                  name="titleTh"
                  value={editForm.titleTh}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Title (EN):
                <input
                  name="titleEn"
                  value={editForm.titleEn}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Sub (TH):
                <input
                  name="subTh"
                  value={editForm.subTh}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Sub (EN):
                <input
                  name="subEn"
                  value={editForm.subEn}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Description (TH):
                <textarea
                  name="descriptionTh"
                  value={editForm.descriptionTh}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1 h-24"
                />
              </label>
              <label className="block">
                Description (EN):
                <textarea
                  name="descriptionEn"
                  value={editForm.descriptionEn}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1 h-24"
                />
              </label>
              <label className="block">
                Order:
                <input
                  name="order"
                  type="number"
                  value={editForm.order}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>
              <label className="block">
                Position:
                <select
                  name="position"
                  value={editForm.position}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2 mt-1"
                >
                  <option value="hero">Hero</option>
                  <option value="sub">Sub</option>
                </select>
              </label>
              <label className="block">
                รูปใหม่ (ไม่บังคับ):
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleEditChange}
                  className="mt-1"
                />
              </label>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  บันทึก / Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
