import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  Share2,
  Package,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import QuantitySelector from "@/components/QuantitySelector";
import { prisma } from "@/lib/prisma";
import { useAuth } from "@/context/AuthContext";
import { calculateDeliveryDate } from "@/lib/shippingUtils";
import { goBackOrPush } from "@/lib/navigation";
import type { ProductLocale } from "@prisma/client";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";

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

function extractProductImages(imageUrl: string | null): string[] {
  if (!imageUrl) return ["/images/placeholder.png"];

  const raw = imageUrl.trim();
  if (!raw) return ["/images/placeholder.png"];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const list = parsed
          .map((item) => String(item || "").trim())
          .filter(Boolean);
        if (list.length > 0) return Array.from(new Set(list));
      }
    } catch {
      // fallback below
    }
  }

  const byDelimiter = raw
    .split(/\r?\n|\s*\|\s*|\s*;\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (byDelimiter.length > 0) {
    return Array.from(new Set(byDelimiter));
  }

  return [raw];
}

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const { token, user } = useAuth();

  // State management
  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [distanceKm] = useState(100);
  const galleryImages = useMemo(
    () => extractProductImages(product?.imageUrl ?? null),
    [product?.imageUrl],
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const activeImage =
    galleryImages[selectedImageIndex] || galleryImages[0] || "/images/placeholder.png";
  const hasMultipleImages = galleryImages.length > 1;
  const otherImageItems = useMemo(
    () =>
      galleryImages
        .map((img, index) => ({ img, index }))
        .filter(({ index }) => index !== selectedImageIndex),
    [galleryImages, selectedImageIndex],
  );

  const handleBack = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      router.push("/all-products");
      return;
    }

    goBackOrPush(router, "/all-products");
  };

  // Calculate delivery date when shipping method changes
  useEffect(() => {
    const date = calculateDeliveryDate(
      selectedShipping as "standard" | "express",
      distanceKm,
    );
    setDeliveryDate(date);
  }, [selectedShipping, distanceKm]);

  useEffect(() => {
    if (!product?.id) return;
    setIsWishlisted(isInWishlist(product.id, user?.id));
  }, [product?.id, user?.id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id, galleryImages.length]);

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to home
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
        normalizedDescription
          .match(/.{1,70}(?:\s|$)/g)
          ?.map((line) => line.trim()) || []
      ).filter(Boolean);
  const finalDescriptionLines =
    fallbackLines.length > 0
      ? fallbackLines
      : ["รายละเอียดสินค้ายังไม่ถูกระบุ"];
  const hasMoreDescriptionLines = finalDescriptionLines.length > 3;
  const visibleDescriptionLines = isDescriptionExpanded
    ? finalDescriptionLines
    : finalDescriptionLines.slice(0, 3);

  // Handlers
  const requireLogin = () => {
    if (!token) {
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleWishlist = () => {
    if (!product) return;
    const next = toggleWishlist(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      user?.id,
    );
    setIsWishlisted(next);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied");
      }
    } catch {
      // no-op
    }
  };

  const showPreviousImage = () => {
    if (!hasMultipleImages) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1,
    );
  };

  const showNextImage = () => {
    if (!hasMultipleImages) return;
    setSelectedImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1,
    );
  };

  const addToCart = async (redirect: "cart" | "checkout" | "none") => {
    if (!requireLogin()) return;
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

      if (!res.ok) {
        throw new Error("Cannot add product to cart");
      }

      if (redirect === "cart") router.push("/cart");
      if (redirect === "checkout") router.push("/checkout");
      if (redirect === "none") alert("เพิ่มสินค้าลงตะกร้าแล้ว");
    } catch (error) {
      console.error(error);
      alert("เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={product.name}>
      <div className="min-h-screen desktop-page bg-[#f3f3f4] pb-[186px] md:pb-12">
        {/* Mobile Header - Only on Mobile */}
        <div className="md:hidden sticky top-0 z-50 border-b border-[#d5d8de] bg-[#f3f3f4]">
          <div className="mx-auto w-full max-w-[440px]">
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
                    className={`h-7 w-7 ${isWishlisted ? "fill-[#ff4f80] text-[#ff4f80]" : ""
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
          </div>
        </div>

        {/* Desktop & Mobile Content */}
        <div className="app-page-container md:pt-6 desktop-shell">
          <div className="md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-start md:gap-8 md:px-6 md:py-6">
            <section className="md:sticky md:top-28">
              <div className="relative h-[300px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 sm:h-[340px] md:h-[620px] md:rounded-3xl">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 52vw"
                />
                {hasMultipleImages ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="รูปก่อนหน้า"
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#1f2937] shadow-md backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="รูปถัดไป"
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#1f2937] shadow-md backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                ) : null}
                {hasDiscount && (
                  <div className="absolute right-4 top-4 rounded-2xl bg-gradient-to-r from-[#f05a2b] to-[#ec3ea8] px-4 py-2 text-[20px] font-bold text-white shadow-md">
                    ลด {discountPercent}%
                  </div>
                )}
              </div>

              {otherImageItems.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-[#d8dde8] bg-white/90 p-3 md:p-4">
                  <p className="mb-2 text-[15px] font-semibold text-[#6b7280]">
                    รูปอื่นๆ
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {otherImageItems.map(({ img, index }) => (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`ดูรูปที่ ${index + 1}`}
                        className="relative aspect-square overflow-hidden rounded-xl border border-[#d1d5db] transition hover:border-[#2f6ef4]"
                      >
                        <Image
                          src={img}
                          alt={`${product.name} รูปที่ ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 28vw, 16vw"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {/* Product Details */}
            <main className="space-y-5 py-4 md:space-y-4 md:py-0">
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

                <h1 className="overflow-safe break-words text-[28px] font-extrabold leading-tight text-[#111827]">
                  {product.name}
                </h1>
              </section>

              <section className="rounded-2xl border border-[#d8dde8] bg-white p-4">
                <h2 className="mb-2 text-[24px] font-extrabold text-[#111827]">
                  รายละเอียดสินค้า
                </h2>

                <ul className="space-y-2">
                  {visibleDescriptionLines.map((line, idx) => (
                    <li
                      key={`${line}-${idx}`}
                      className="flex items-start gap-2 text-[18px] leading-relaxed text-[#374151]"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                      <span className="overflow-safe break-words">{line}</span>
                    </li>
                  ))}
                </ul>

                {hasMoreDescriptionLines ? (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="mt-3 text-[16px] font-semibold text-[#2f6ef4]"
                  >
                    {isDescriptionExpanded
                      ? "ย่อรายละเอียด"
                      : "ดูรายละเอียดเพิ่มเติม"}
                  </button>
                ) : null}
              </section>

              <section>
                <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">
                  วิธีจัดส่ง
                </h2>

                <button
                  type="button"
                  onClick={() => setSelectedShipping("standard")}
                  className={`mb-2 flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left ${selectedShipping === "standard"
                    ? "border-[#2f6ef4] bg-[#e9f0ff]"
                    : "border-[#d1d5db] bg-white"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selectedShipping === "standard"
                        ? "border-[#2f6ef4] bg-[#2f6ef4]"
                        : "border-[#d1d5db]"
                        }`}
                    >
                      {selectedShipping === "standard" ? (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="text-[19px] font-semibold text-[#111827]">
                      จัดส่งปกติ
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#dfe7f8] px-2 py-1 text-[14px] text-[#2f6ef4]">
                      5-7 วัน
                    </span>
                    <span className="text-[19px] font-bold text-[#6b7280]">
                      ตามระยะทาง
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShipping("express")}
                  className={`mb-2 flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left ${selectedShipping === "express"
                    ? "border-[#2f6ef4] bg-[#e9f0ff]"
                    : "border-[#d1d5db] bg-white"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selectedShipping === "express"
                        ? "border-[#2f6ef4] bg-[#2f6ef4]"
                        : "border-[#d1d5db]"
                        }`}
                    >
                      {selectedShipping === "express" ? (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="text-[19px] font-semibold text-[#111827]">
                      จัดส่งด่วน
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#dfe7f8] px-2 py-1 text-[14px] text-[#2f6ef4]">
                      1-2 วัน
                    </span>
                    <span className="text-[19px] font-bold text-[#111827]">
                      ตามระยะทาง + ฿50
                    </span>
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
                    <p className="text-[18px] font-semibold text-[#177245]">
                      ค่าจัดส่งตามระยะทาง
                    </p>
                    <p className="text-[14px] text-[#2f855a]">
                      สำหรับทุกคำสั่งซื้อ
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-[26px] font-extrabold text-[#111827]">
                  จำนวน
                </h2>
                <QuantitySelector
                  quantity={quantity}
                  onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                  onIncrease={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  max={product.stock}
                  disabled={isOutOfStock}
                />
              </section>

              {/* Desktop Action Buttons */}
              <section className="hidden md:flex gap-3 pt-4">
                <button
                  onClick={handleWishlist}
                  aria-label="เพิ่มในรายการโปรด"
                  className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-[#2f6ef4] px-6 text-[18px] font-bold text-[#2f6ef4] hover:bg-[#2f6ef4] hover:text-white transition-colors"
                >
                  <Heart
                    className={`h-6 w-6 ${isWishlisted ? "fill-[#ff4f80] text-[#ff4f80]" : ""
                      }`}
                  />
                  {isWishlisted ? "ลบจากรายการโปรด" : "เพิ่มในรายการโปรด"}
                </button>
                <button
                  onClick={() => {
                    void addToCart("none");
                  }}
                  disabled={loading || isOutOfStock}
                  className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-[#2f6ef4] px-6 text-[18px] font-bold text-[#2f6ef4] disabled:opacity-40 hover:bg-blue-50 transition-colors"
                >
                  {loading ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
                </button>
                <button
                  onClick={() => {
                    void addToCart("checkout");
                  }}
                  disabled={loading || isOutOfStock}
                  className={`flex h-14 flex-1 items-center justify-center rounded-xl px-6 text-[18px] font-bold ${isOutOfStock
                    ? "bg-[#d1d5db] text-[#6b7280]"
                    : "bg-[#2f6ef4] text-white hover:bg-[#2558c7] transition-colors"
                    }`}
                >
                  {isOutOfStock
                    ? "สินค้าหมด"
                    : loading
                      ? "กำลังเพิ่ม..."
                      : "ซื้อเลย"}
                </button>
              </section>
            </main>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div
          className="md:hidden fixed left-0 right-0 z-50 border-t border-[#d5d8de] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex w-full max-w-[440px] items-center gap-3 px-4 py-3">
            <button
              onClick={handleWishlist}
              aria-label="เพิ่มในรายการโปรด"
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[#d1d5db]"
            >
              <Heart
                className={`h-7 w-7 ${isWishlisted
                  ? "fill-[#ff4f80] text-[#ff4f80]"
                  : "text-[#9ca3af]"
                  }`}
              />
            </button>

            <button
              onClick={() => {
                void addToCart("none");
              }}
              disabled={loading || isOutOfStock}
              className="flex-1 rounded-2xl border-2 border-[#2f6ef4] py-3 text-[18px] font-bold text-[#2f6ef4] disabled:opacity-40"
            >
              {loading ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
            </button>

            <button
              onClick={() => {
                void addToCart("checkout");
              }}
              disabled={loading || isOutOfStock}
              className={`flex-1 rounded-2xl py-3 text-[18px] font-bold ${isOutOfStock
                ? "bg-[#d1d5db] text-[#6b7280]"
                : "bg-[#2f6ef4] text-white"
                }`}
            >
              {isOutOfStock
                ? "สินค้าหมด"
                : loading
                  ? "กำลังเพิ่ม..."
                  : "ซื้อเลย"}
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

