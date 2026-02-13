import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Heart, Pencil, Trash2 } from "lucide-react";
import ProvinceSelect from "@/components/ProvinceSelect";

type AddressItem = {
  id: string;
  recipient: string;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
};

type AddressForm = {
  recipient: string;
  line1: string;
  line2: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
};

const ADDRESS_PARTS_SEPARATOR = "||";

function parseAddressLine2(line2?: string | null) {
  const raw = String(line2 || "").trim();
  if (!raw) return { subdistrict: "", district: "" };
  if (raw.includes(ADDRESS_PARTS_SEPARATOR)) {
    const [subdistrict, district] = raw.split(ADDRESS_PARTS_SEPARATOR);
    return {
      subdistrict: (subdistrict || "").trim(),
      district: (district || "").trim(),
    };
  }
  return { subdistrict: raw, district: "" };
}

function buildAddressLine2(subdistrict: string, district: string) {
  const sub = subdistrict.trim();
  const dist = district.trim();
  if (!sub && !dist) return "";
  if (!dist) return sub;
  return `${sub}${ADDRESS_PARTS_SEPARATOR}${dist}`;
}

const EMPTY_FORM: AddressForm = {
  recipient: "",
  line1: "",
  line2: "",
  district: "",
  city: "",
  postalCode: "",
  country: "ไทย",
};

export default function AddressBookPage() {
  const { t } = useTranslation("common");
  const { token, user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AddressItem[]>([]);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preferredKey = useMemo(
    () => `preferred_address:${user?.id || "guest"}`,
    [user?.id]
  );
  const preferredDataKey = useMemo(
    () => `preferred_address_data:${user?.id || "guest"}`,
    [user?.id]
  );

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    const savedPreferred = localStorage.getItem(preferredKey);
    if (savedPreferred) setPreferredId(savedPreferred);
  }, [token, router, preferredKey]);

  const loadAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [token]);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    const payload = {
      recipient: form.recipient.trim(),
      line1: form.line1.trim(),
      line2: buildAddressLine2(form.line2, form.district),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
    };

    if (!payload.recipient || !payload.line1 || !payload.city || !payload.postalCode || !payload.country) {
      setError(t("addresses.required"));
      return;
    }

    const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || t("addresses.saveError"));
      return;
    }

    if (editingId && editingId === preferredId) {
      localStorage.setItem(
        preferredDataKey,
        JSON.stringify({
          recipient: payload.recipient,
          line1: payload.line1,
          line2: form.line2.trim(),
          line3: form.district.trim(),
          city: payload.city,
          postalCode: payload.postalCode,
          country: payload.country,
        })
      );
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    await loadAddresses();
  };

  const onEdit = (item: AddressItem) => {
    const parsed = parseAddressLine2(item.line2);
    setEditingId(item.id);
    setForm({
      recipient: item.recipient,
      line1: item.line1,
      line2: parsed.subdistrict,
      district: parsed.district,
      city: item.city,
      postalCode: item.postalCode,
      country: item.country,
    });
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/addresses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    if (preferredId === id) {
      setPreferredId(null);
      localStorage.removeItem(preferredKey);
      localStorage.removeItem(preferredDataKey);
    }
    await loadAddresses();
  };

  const setPreferred = (id: string) => {
    setPreferredId(id);
    localStorage.setItem(preferredKey, id);
    const selected = items.find((it) => it.id === id);
    if (selected) {
      const parsed = parseAddressLine2(selected.line2);
      localStorage.setItem(
        preferredDataKey,
        JSON.stringify({
          recipient: selected.recipient || "",
          line1: selected.line1 || "",
          line2: parsed.subdistrict,
          line3: parsed.district,
          city: selected.city || "",
          postalCode: selected.postalCode || "",
          country: selected.country || "",
        })
      );
    }
  };

  if (!token) return null;

  return (
    <Layout title={t("addresses.title")}>
      <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-5">{t("addresses.title")}</h1>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <h2 className="text-lg font-semibold mb-3">
            {editingId ? t("addresses.editAddress") : t("addresses.addAddress")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t("checkout.recipient")}
              value={form.recipient}
              onChange={(e) => setForm((s) => ({ ...s, recipient: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t("checkout.country")}
              value={form.country}
              onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t("checkout.line1")}
              value={form.line1}
              onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t("checkout.line2")}
              value={form.line2}
              onChange={(e) => setForm((s) => ({ ...s, line2: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t("checkout.line3")}
              value={form.district}
              onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))}
            />
            <div className="border border-gray-300 rounded-lg p-1">
              <ProvinceSelect
                value={form.city}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              />
            </div>
            <input
              className="border border-gray-300 rounded-lg p-3 md:col-span-2"
              placeholder={t("checkout.postalCode")}
              value={form.postalCode}
              onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))}
            />
          </div>
          {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onSubmit}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? t("addresses.update") : t("addresses.save")}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg"
              >
                {t("addresses.cancel")}
              </button>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          {loading ? <p className="text-gray-600">{t("addresses.loading")}</p> : null}
          {!loading && items.length === 0 ? (
            <p className="text-gray-600">{t("addresses.empty")}</p>
          ) : null}

          {items.map((item) => {
            const isPreferred = preferredId === item.id;
            const parsed = parseAddressLine2(item.line2);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{item.recipient}</p>
                      {isPreferred ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                          {t("addresses.preferred")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-gray-700 mt-1">
                      {item.line1}
                      {parsed.subdistrict ? `, ${parsed.subdistrict}` : ""}
                      {parsed.district ? `, ${parsed.district}` : ""}, {item.city} {item.postalCode}
                    </p>
                    <p className="text-gray-500 text-sm">{item.country}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={`p-2 rounded-md ${isPreferred ? "text-pink-600" : "text-gray-500 hover:text-pink-600"}`}
                      onClick={() => setPreferred(item.id)}
                      title={t("addresses.setPreferred")}
                    >
                      <Heart className={`w-4 h-4 ${isPreferred ? "fill-pink-600" : ""}`} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-blue-600"
                      onClick={() => onEdit(item)}
                      title={t("addresses.edit")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-red-600"
                      onClick={() => onDelete(item.id)}
                      title={t("addresses.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </Layout>
  );
}
