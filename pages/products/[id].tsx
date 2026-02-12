// pages/products/[id].tsx
import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  Share2,
  Package,
  Check,
} from "lucide-react";
import Layout from "@/components/Layout";
import ProductOptions, { ProductOption } from "@/components/ProductOptions";
import QuantitySelector from "@/components/QuantitySelector";
import { prisma } from "@/lib/prisma";
import { useAuth } from "@/context/AuthContext";
import { calculateDeliveryDate } from "@/lib/shippingUtils";
import { goBackOrPush } from "@/lib/navigation";
import type { ProductLocale } from "@prisma/client";

interface ProductPageProps {
  product: {
    id: string;
    name: string;
    description: string;
    material: string | null;
    price: number;
    salePrice: number | null;
    stock: number;
    imageUrl: string | null;
    categoryId: string | null;
  } | null;
}

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  // State management
  const [selectedOption, setSelectedOption] = useState<string | null>("pink");
  const [selectedSize, setSelectedSize] = useState<string | null>("M");
  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(100); // Default ~100km from Bangkok

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  // Calculate delivery date when shipping method changes
  useEffect(() => {
    const date = calculateDeliveryDate(
      selectedShipping as "standard" | "express",
      distanceKm,
    );
    setDeliveryDate(date);
  }, [selectedShipping, distanceKm]);

  if (!product) {
    return (
      <Layout title="ไม่พบสินค้า">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-semibold">ไม่พบสินค้า</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← กลับหน้าหลัก
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate discount
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = product.salePrice || product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const isOutOfStock = product.stock === 0;

  const normalizedDescription = (product.description || "")
    .replace(/\s+/g, " ")
    .trim();
  const descriptionLines = normalizedDescription
    .split(/[.!?]+|ๆ/)
    .map((line) => line.trim())
    .filter(Boolean);
  const fallbackLines =
    descriptionLines.length > 0
      ? descriptionLines
      : (
          normalizedDescription.match(/.{1,70}(?:\s|$)/g)?.map((line) => line.trim()) || []
        ).filter(Boolean);
  const finalDescriptionLines =
    fallbackLines.length > 0 ? fallbackLines : ["รายละเอียดสินค้ายังไม่ถูกระบุ"];
  const hasMoreDescriptionLines = finalDescriptionLines.length > 3;
  const visibleDescriptionLines = isDescriptionExpanded
    ? finalDescriptionLines
    : finalDescriptionLines.slice(0, 3);

  // Product options
  const productOptions: ProductOption[] = [
    { id: "1", label: "ชมพู", value: "pink", color: "#f78090" },
    { id: "2", label: "เหลือง", value: "yellow", color: "#f4c542" },
    { id: "3", label: "แดง", value: "red", color: "#d0011b" },
    { id: "4", label: "ม่วง", value: "purple", color: "#9b59b6" },
  ];

  // Size options
  const sizeOptions: ProductOption[] = [
    { id: "s", label: "S", value: "S" },
    { id: "m", label: "M", value: "M" },
    { id: "l", label: "L", value: "L" },
    { id: "xl", label: "XL", value: "XL" },
    { id: "xxl", label: "XXL", value: "XXL", disabled: true },
    { id: "xxxl", label: "XXXL", value: "XXXL", disabled: true },
  ];

  // Handlers
  const handleWishlist = () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (product.stock === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!res.ok) throw new Error("เพิ่มสินค้าล้มเหลว");
      router.push("/cart");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={product.name}>
      <div className="min-h-screen bg-[#f3f3f4] pb-[186px]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="sticky top-0 z-50 border-b border-[#d5d8de] bg-[#f3f3f4]">
            <div className="flex h-[78px] items-center px-4">
              <button
                onClick={handleBack}
                aria-label="ย้อนกลับ"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#3f4756]"
              >
                <ArrowLeft className="h-7 w-7" />
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleWishlist}
                  aria-label="เพิ่มในรายการโปรด"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#5f6775]"
                >
                  <Heart
                    className={`h-7 w-7 ${
                      isWishlisted ? "fill-[#ff4f80] text-[#ff4f80]" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="แชร์สินค้า"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce1ea] text-[#5f6775]"
                >
                  <Share2 className="h-7 w-7" />
                </button>
              </div>
            </div>
          </header>

          <div className="relative h-[300px] w-full bg-gradient-to-br from-yellow-400 to-yellow-500 sm:h-[340px]">
            <Image
              src={product.imageUrl || "/images/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <div className="absolute right-4 top-4 rounded-2xl bg-gradient-to-r from-[#f05a2b] to-[#ec3ea8] px-4 py-2 text-[20px] font-bold text-white shadow-md">
                ลด {discountPercent}%
              </div>
            )}
          </div>

          <main className="space-y-5 px-4 py-4">
            <section>
              <div className="mb-2 flex items-end gap-3">
                <span className="text-[36px] font-extrabold leading-none text-[#2f6ef4]">
                  ฿{displayPrice.toLocaleString("th-TH")}
                </span>
                {hasDiscount ? (
                  <span className="pb-1 text-[24px] text-[#9ca3af] line-through">
                    ฿{product.price.toLocaleString("th-TH")}
                  </span>
                ) : null}
              </div>

              <h1 className="text-[28px] font-extrabold leading-tight text-[#111827]">
                {product.name}
              </h1>
            </section>

            <section className="rounded-2xl border border-[#d8dde8] bg-white p-4">
              <h2 className="mb-2 text-[24px] font-extrabold text-[#111827]">
                รายละเอียดสินค้า
              </h2>

              <ul className="space-y-2">
                {visibleDescriptionLines.map((line, idx) => (
                  <li key={`${line}-${idx}`} className="flex items-start gap-2 text-[18px] leading-relaxed text-[#374151]">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {hasMoreDescriptionLines ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  className="mt-3 text-[16px] font-semibold text-[#2f6ef4]"
                >
                  {isDescriptionExpanded ? "ย่อรายละเอียด" : "ดูรายละเอียดเพิ่มเติม"}
                </button>
              ) : null}
            </section>

            <section>
              <ProductOptions
                title="เลือก สี"
                options={productOptions}
                selectedValue={selectedOption}
                onSelect={setSelectedOption}
                type="color"
              />

              <ProductOptions
                title="ไซซ์"
                options={sizeOptions}
                selectedValue={selectedSize}
                onSelect={setSelectedSize}
                type="text"
              />
            </section>

            <section>
              <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">ข้อมูลเพิ่มเติม</h2>

              {product.material ? (
                <div className="mb-3">
                  <h3 className="mb-2 text-[20px] font-semibold text-[#1f2937]">วัสดุ</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.material.split(",").map((mat, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-[#f2dfe2] px-3 py-1.5 text-[16px] font-medium text-[#374151]"
                      >
                        {mat.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mb-3">
                <h3 className="mb-2 text-[20px] font-semibold text-[#1f2937]">ผลิตจาก</h3>
                <span className="inline-flex rounded-lg bg-[#dfe7f8] px-3 py-1.5 text-[16px] font-medium text-[#374151]">
                  EU
                </span>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">วิธีจัดส่ง</h2>

              <button
                type="button"
                onClick={() => setSelectedShipping("standard")}
                className={`mb-2 flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left ${
                  selectedShipping === "standard"
                    ? "border-[#2f6ef4] bg-[#e9f0ff]"
                    : "border-[#d1d5db] bg-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selectedShipping === "standard"
                        ? "border-[#2f6ef4] bg-[#2f6ef4]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedShipping === "standard" ? (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className="text-[19px] font-semibold text-[#111827]">จัดส่งปกติ</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#dfe7f8] px-2 py-1 text-[14px] text-[#2f6ef4]">
                    5-7 วัน
                  </span>
                  <span className="text-[19px] font-bold text-[#27b05f]">ฟรี</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedShipping("express")}
                className={`mb-2 flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left ${
                  selectedShipping === "express"
                    ? "border-[#2f6ef4] bg-[#e9f0ff]"
                    : "border-[#d1d5db] bg-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selectedShipping === "express"
                        ? "border-[#2f6ef4] bg-[#2f6ef4]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedShipping === "express" ? (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className="text-[19px] font-semibold text-[#111827]">จัดส่งด่วน</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#dfe7f8] px-2 py-1 text-[14px] text-[#2f6ef4]">
                    1-2 วัน
                  </span>
                  <span className="text-[19px] font-bold text-[#111827]">฿50</span>
                </span>
              </button>

              {deliveryDate ? (
                <p className="mb-3 text-[15px] text-[#6b7280]">
                  จะจัดส่งถึงภายใน{deliveryDate}
                </p>
              ) : null}

              <div className="flex items-center gap-3 rounded-xl bg-[#e3f3ea] px-3 py-3">
                <Package className="h-7 w-7 text-[#27b05f]" />
                <div>
                  <p className="text-[18px] font-semibold text-[#177245]">จัดส่งฟรี</p>
                  <p className="text-[14px] text-[#2f855a]">สำหรับคำสั่งซื้อ 500 บาทขึ้นไป</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">จำนวน</h2>
              <QuantitySelector
                quantity={quantity}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrease={() => setQuantity(Math.min(product.stock, quantity + 1))}
                max={product.stock}
                disabled={isOutOfStock}
              />
            </section>
          </main>
        </div>

        <div
          className="fixed left-0 right-0 z-50 border-t border-[#d5d8de] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex w-full max-w-[440px] items-center gap-3 px-4 py-3">
            <button
              onClick={handleWishlist}
              aria-label="เพิ่มในรายการโปรด"
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[#d1d5db]"
            >
              <Heart
                className={`h-7 w-7 ${
                  isWishlisted ? "fill-[#ff4f80] text-[#ff4f80]" : "text-[#9ca3af]"
                }`}
              />
            </button>

              <button
                onClick={async () => {
                if (!token) {
                  router.push("/login");
                  return;
                }
                if (isOutOfStock) return;

                try {
                  const res = await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ productId: product.id, quantity }),
                  });
                  if (res.ok) {
                    alert("เพิ่มสินค้าลงตะกร้าแล้ว");
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
              disabled={isOutOfStock}
              className="flex-1 rounded-2xl border-2 border-[#2f6ef4] py-3 text-[18px] font-bold text-[#2f6ef4] disabled:opacity-40"
            >
              เพิ่มลงตะกร้า
            </button>

            <button
              onClick={handleAddToCart}
              disabled={loading || isOutOfStock}
              className={`flex-1 rounded-2xl py-3 text-[18px] font-bold ${
                isOutOfStock
                  ? "bg-[#d1d5db] text-[#6b7280]"
                  : "bg-[#2f6ef4] text-white"
              }`}
            >
              {isOutOfStock ? "สินค้าหมด" : loading ? "กำลังเพิ่ม..." : "ซื้อเลย"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async ({
  params,
  locale,
}) => {
  const id = params?.id as string;
  const lang = locale ?? "th";

  const raw = await prisma.product.findUnique({
    where: { id },
    include: {
      translations: { where: { locale: lang }, take: 1 },
    },
  });

  if (!raw) {
    return { props: { product: null } };
  }

  const trans = raw.translations[0] as ProductLocale | undefined;
  const product = trans
    ? {
        id: raw.id,
        name: trans.name,
        description: trans.description ?? "",
        material: trans.material ?? null,
        price: raw.price,
        salePrice: raw.salePrice,
        stock: raw.stock,
        imageUrl: raw.imageUrl,
        categoryId: raw.categoryId,
      }
    : null;

  return {
    props: {
      product,
    },
  };
};
