import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Building2,
  House,
  Plus,
  Star,
  Trash2,
  BriefcaseBusiness,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";
import {
  clearCheckoutSelectedAddressId,
  clearDefaultAddressId,
  getAddressMeta,
  getAddressTypeDefaultLabel,
  getCheckoutSelectedAddressId,
  getDefaultAddressId,
  removeAddressMeta,
  setCheckoutSelectedAddressId,
  setDefaultAddressId,
} from "@/lib/addressStorage";
import { composeAddressSummary, parseAddressLine2 } from "@/lib/addressLine2";

type AddressItem = {
  id: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

export default function AddressesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressIdState] = useState("");
  const [defaultAddressId, setDefaultAddressIdState] = useState("");
  const [deletingAddress, setDeletingAddress] = useState<AddressItem | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fromCheckout = router.query.from === "checkout";

  const loadAddresses = useCallback(async () => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        setAddresses([]);
        return;
      }

      const data = (await res.json()) as { addresses?: AddressItem[] };
      const items = data.addresses ?? [];
      setAddresses(items);

      if (items.length === 0) {
        setDefaultAddressIdState("");
        setSelectedAddressIdState("");
        clearDefaultAddressId();
        clearCheckoutSelectedAddressId();
        return;
      }

      const savedDefaultId = getDefaultAddressId();
      const nextDefaultId = items.some((item) => item.id === savedDefaultId)
        ? savedDefaultId
        : items[0].id;

      setDefaultAddressId(nextDefaultId);
      setDefaultAddressIdState(nextDefaultId);

      const savedSelectedId = getCheckoutSelectedAddressId();
      const nextSelectedId = items.some((item) => item.id === savedSelectedId)
        ? savedSelectedId
        : nextDefaultId;

      setCheckoutSelectedAddressId(nextSelectedId);
      setSelectedAddressIdState(nextSelectedId);
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const addressMetaMap = useMemo(() => {
    return new Map(addresses.map((item) => [item.id, getAddressMeta(item.id)]));
  }, [addresses]);

  const handleBack = () => {
    goBackOrPush(router, fromCheckout ? "/checkout" : "/account");
  };

  const handleSelectForCheckout = (addressId: string) => {
    setCheckoutSelectedAddressId(addressId);
    setSelectedAddressIdState(addressId);
    if (fromCheckout) {
      router.push("/checkout");
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultAddressId(addressId);
    setDefaultAddressIdState(addressId);
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;

    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/addresses/${deletingAddress.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        return;
      }

      const nextItems = addresses.filter(
        (item) => item.id !== deletingAddress.id,
      );
      setAddresses(nextItems);

      removeAddressMeta(deletingAddress.id);
      clearDefaultAddressId(deletingAddress.id);
      clearCheckoutSelectedAddressId(deletingAddress.id);

      if (nextItems.length > 0) {
        const nextDefaultId = nextItems[0].id;
        if (defaultAddressId === deletingAddress.id) {
          setDefaultAddressId(nextDefaultId);
          setDefaultAddressIdState(nextDefaultId);
        }

        if (selectedAddressId === deletingAddress.id) {
          setCheckoutSelectedAddressId(nextDefaultId);
          setSelectedAddressIdState(nextDefaultId);
        }
      } else {
        setDefaultAddressIdState("");
        setSelectedAddressIdState("");
      }

      setDeletingAddress(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px] md:max-w-5xl">
        <header className="sticky top-16 sm:top-20 md:top-24 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4] md:bg-white md:shadow-sm">
          <div className="flex h-[84px] md:h-[92px] items-center px-4 md:px-6">
            <button
              type="button"
              aria-label="ย้อนกลับ"
              onClick={handleBack}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#2c3443]"
            >
              <ArrowLeft className="h-7 w-7" strokeWidth={2.25} />
            </button>

            <div className="ml-4 min-w-0">
              <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-black">
                ที่อยู่จัดส่ง
              </h1>
              <p className="text-[16px] text-[#6b7280]">
                {addresses.length} ที่อยู่
              </p>
            </div>

            <button
              type="button"
              aria-label="เพิ่มที่อยู่ใหม่"
              onClick={() =>
                router.push(
                  fromCheckout
                    ? "/account/addresses/new?from=checkout"
                    : "/account/addresses/new",
                )
              }
              className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6ef4] text-white"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <main className="space-y-4 px-4 pb-[120px] pt-4">
          {loading ? (
            <div className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center text-[17px] text-[#6b7280]">
              กำลังโหลดที่อยู่...
            </div>
          ) : addresses.length === 0 ? (
            <section className="rounded-2xl border border-[#d8d8d8] bg-white p-6 text-center">
              <h2 className="text-[24px] font-extrabold text-[#111827]">
                ยังไม่มีที่อยู่จัดส่ง
              </h2>
              <p className="mt-1 text-[17px] text-[#6b7280]">
                เพิ่มที่อยู่เพื่อใช้งานหน้าชำระเงิน
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    fromCheckout
                      ? "/account/addresses/new?from=checkout"
                      : "/account/addresses/new",
                  )
                }
                className="mt-4 rounded-2xl bg-[#2f6ef4] px-8 py-2.5 text-[18px] font-medium text-white"
              >
                เพิ่มที่อยู่ใหม่
              </button>
            </section>
          ) : (
            addresses.map((address) => {
              const meta = addressMetaMap.get(address.id) ?? {
                type: "home" as const,
                label: getAddressTypeDefaultLabel("home"),
              };
              const parsedLine2 = parseAddressLine2(address.line2);
              const isDefault = defaultAddressId === address.id;
              const isSelected =
                fromCheckout && selectedAddressId === address.id;

              const Icon =
                meta.type === "home"
                  ? House
                  : meta.type === "work"
                    ? BriefcaseBusiness
                    : Building2;

              return (
                <article
                  key={address.id}
                  className={`rounded-[24px] border bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${
                    isDefault
                      ? "border-[#2f6ef4]"
                      : isSelected
                        ? "border-[#89a8f4]"
                        : "border-[#d8d8d8]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-[14px] bg-[#2f6ef4] text-white">
                      <Icon className="h-7 w-7" strokeWidth={2.25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {isDefault ? (
                          <span className="rounded-full bg-[#dce8ff] px-3 py-1 text-[14px] font-semibold text-[#2f6ef4]">
                            ค่าเริ่มต้น
                          </span>
                        ) : null}
                        {isSelected ? (
                          <span className="rounded-full bg-[#f5ecbf] px-3 py-1 text-[14px] font-semibold text-[#9c7a00]">
                            โปรด
                          </span>
                        ) : null}
                      </div>

                      <h2 className="line-clamp-1 break-words text-[22px] font-extrabold leading-tight text-[#111827]">
                        {meta.label || getAddressTypeDefaultLabel(meta.type)}
                      </h2>
                      <p className="line-clamp-1 break-words text-[18px] font-semibold leading-tight text-[#111827]">
                        {address.recipient}
                      </p>
                      <p className="text-[17px] leading-tight text-[#6b7280]">
                        {parsedLine2.phone || "-"}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[16px] leading-tight text-[#6b7280]">
                        {composeAddressSummary(address)}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        isDefault
                          ? "ที่อยู่เริ่มต้น"
                          : "ตั้งเป็นที่อยู่เริ่มต้น"
                      }
                      onClick={() => handleSetDefault(address.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          isDefault
                            ? "fill-[#f4b400] text-[#f4b400]"
                            : "text-[#9ca3af]"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                    {fromCheckout ? (
                      <button
                        type="button"
                        onClick={() => handleSelectForCheckout(address.id)}
                        className={`rounded-xl border px-2 py-2 text-[14px] font-semibold ${
                          isSelected
                            ? "border-[#2f6ef4] bg-[#2f6ef4] text-white"
                            : "border-[#2f6ef4] bg-white text-[#2f6ef4]"
                        }`}
                      >
                        ใช้ที่อยู่นี้
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className={`rounded-xl border px-2 py-2 text-[14px] font-semibold ${
                          isDefault
                            ? "border-[#d3dcf1] bg-[#eef3ff] text-[#2f6ef4]"
                            : "border-[#2f6ef4] bg-white text-[#2f6ef4]"
                        }`}
                      >
                        {isDefault ? "ค่าเริ่มต้น" : "ตั้งค่าเริ่มต้น"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          fromCheckout
                            ? `/account/addresses/${address.id}?from=checkout`
                            : `/account/addresses/${address.id}`,
                        )
                      }
                      className="rounded-xl border border-[#2f6ef4] bg-white px-2 py-2 text-[14px] font-semibold text-[#2f6ef4]"
                    >
                      แก้ไข
                    </button>

                    <button
                      type="button"
                      aria-label="ลบที่อยู่"
                      onClick={() => setDeletingAddress(address)}
                      className="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-[#ffe6e6] text-[#f25f5f]"
                    >
                      <Trash2 className="h-6 w-6" strokeWidth={2.2} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>

      {deletingAddress ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 px-5">
          <div className="w-full max-w-[360px] rounded-[28px] bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.2)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffdfe0] text-[#ff5c5f]">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-center text-[26px] font-extrabold text-[#232323]">
              ลบที่อยู่นี้?
            </h3>
            <p className="mt-1 text-center text-[17px] leading-tight text-[#6b7280]">
              ที่อยู่นี้จะถูกลบออกอย่างถาวร
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                className="rounded-xl border border-[#2f6ef4] py-2.5 text-[18px] font-semibold text-[#2f6ef4]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-[#ef3d43] py-2.5 text-[18px] font-semibold text-white disabled:opacity-60"
              >
                {deleteLoading ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileShopBottomNav activePath="/cart" />
    </div>
  );
}
