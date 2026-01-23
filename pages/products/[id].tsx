// pages/products/[id].tsx
import { GetServerSideProps } from "next";
<<<<<<< HEAD
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Product as ProductType } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
=======
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowLeft, Heart, Share2, Star, Package, Check, ShoppingCart } from "lucide-react";
import Layout from "@/components/Layout";
import ProductOptions, { ProductOption } from "@/components/ProductOptions";
import QuantitySelector from "@/components/QuantitySelector";
import ReviewCard from "@/components/ReviewCard";
import { prisma } from "@/lib/prisma";
import { useAuth } from "@/context/AuthContext";
import { calculateDeliveryDate } from "@/lib/shippingUtils";

interface ProductPageProps {
<<<<<<< HEAD
  product:
    | {
        id: string;
        name: string;
        description: string;
        price: number;
        salePrice: number | null;
        stock: number;
        imageUrl: string | null;
      }
    | null;
}

export default function ProductPage({ product }: ProductPageProps) {
  const { t } = useTranslation("common");
=======
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    stock: number;
    imageUrl: string | null;
    categoryId: string | null;
    material: string | null;
  } | null;
}

export default function ProductPage({ product }: ProductPageProps) {
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
  const router = useRouter();
  const { token } = useAuth();

  // State management
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>("EU");
  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(100); // Default ~100km from Bangkok

  // Calculate delivery date when shipping method changes
  useEffect(() => {
    const date = calculateDeliveryDate(
      selectedShipping as "standard" | "express",
      distanceKm
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

  // Debug: Check material data
  console.log("Product data:", product);
  console.log("Material:", product.material);

  // Calculate discount
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = product.salePrice || product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  // Mock data
  const mockRating = 4.9;
  const mockReviewCount = 219;

  // Mock reviews - แสดงเป็นการ์ด
  const mockReviewCards = [
    {
      id: "1",
      userName: "สมศรี มีเงินแสง",
      rating: 5,
      comment: "สินค้าคุณภาพดีมาก ใช้งานได้เป็นอย่างดีมากๆ ขอบคุณร้านค้ามากนะคะ ทั้งผู้ขายอุบายน่ารักมาก",
      timeAgo: "2 วันก่อน",
      avatar: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: "2",
      userName: "สมศรี มีเงินแสง",
      rating: 4,
      comment: "ราคาคุ้มค่า แพคเกจดี ใช้ได้ทุกวัน",
      timeAgo: "2 วันก่อน",
      avatar: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    }
  ];

  // Product options
  const productOptions: ProductOption[] = [
    { id: "1", label: "แดง", value: "red", color: "#EF4444" },
    { id: "2", label: "เหลือง", value: "yellow", color: "#F59E0B" },
    { id: "3", label: "แดงเข้ม", value: "dark-red", color: "#991B1B" },
    { id: "4", label: "ม่วง", value: "purple", color: "#9333EA" },
  ];

  // Size options
  const sizeOptions: ProductOption[] = [
    { id: "eu", label: "EU", value: "EU" },
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
<<<<<<< HEAD
    <Layout title={product.name}>
      <div className="w-full max-w-6xl mx-auto px-8 py-10 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* ภาพสินค้า */}
          <div>
            <img
              src={product.imageUrl || "/images/placeholder.png"}
              alt={product.name}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* รายละเอียดสินค้า */}
          <div>
            <h1 className="text-4xl font-extrabold mb-4">{product.name}</h1>
            <p className="text-gray-700 mb-6">{product.description}</p>

            {product.salePrice != null ? (
              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-3xl text-red-600 font-bold">
                  ฿ {product.salePrice}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ฿ {product.price}
                </span>
              </div>
            ) : (
              <p className="text-3xl text-green-700 mb-6">
                ฿ {product.price}
              </p>
            )}

            <p className="mb-4 text-sm text-gray-500">
              {t("stock")}: {product.stock}
            </p>

            {product.stock === 0 ? (
              <p className="text-red-600 font-semibold">{t("outOfStock")}</p>
            ) : (
              <div className="mb-6">
                <label className="block mb-1 text-sm">{t("quantity")}:</label>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
            )}

            <button
              onClick={addToCart}
              disabled={loading || !!error || product.stock === 0}
              className={`px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${
                loading || error || product.stock === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {product.stock === 0
                ? t("cannotBuy")
                : loading
                ? t("adding")
                : t("addToCart")}
            </button>

            <div className="mt-8">
              <Link href="/" className="text-blue-600 hover:underline text-sm">
                ← {t("backHome")}
              </Link>
=======
    <Layout title={product.name} hideBottomNav={true}>
      <div className="min-h-screen bg-white pb-40">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleWishlist}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <Heart
                className={`w-6 h-6 ${
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </button>
            <button
              onClick={() => router.push("/cart")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <Share2 className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Product Image */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-yellow-400 to-yellow-500">
          <Image
            src={product.imageUrl || "/images/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {hasDiscount && (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
              ลด {discountPercent}%
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 py-5">
          {/* Price */}
          <div className="mb-3">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-blue-600">
                  ฿{displayPrice.toLocaleString()}
                </span>
                <span className="text-xl text-gray-400 line-through">
                  ฿{product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-blue-600">
                ฿{displayPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-semibold text-gray-900">
              {mockRating}
            </span>
            <span className="text-base text-gray-500">
              ({mockReviewCount} รีวิว)
            </span>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              รายละเอียดสินค้า
            </h3>
            <p className="text-base text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                รีวิวลูกค้า
              </h3>
              <button className="text-blue-600 text-base font-semibold hover:underline">
                เพิ่มรีวิว
              </button>
            </div>

            {mockReviewCards.map((review) => (
              <ReviewCard
                key={review.id}
                userName={review.userName}
                rating={review.rating}
                comment={review.comment}
                timeAgo={review.timeAgo}
                userAvatar={review.avatar}
              />
            ))}

            <button className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-base hover:bg-blue-50 transition-colors">
              ดูรีวิวทั้งหมด
            </button>
          </div>

          {/* Material Composition */}
          {product.material && (
            <div className="mb-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                รายละเอียด
              </h3>
              <div className="mb-3">
                <h4 className="text-base font-semibold text-gray-900 mb-2">วัสดุ</h4>
                <div className="flex flex-wrap gap-2">
                  {product.material.split(',').map((mat, idx) => (
                    <div key={idx} className="px-4 py-2 bg-pink-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{mat.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shipping Options */}
          <div className="mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
              วิธีจัดส่ง
            </h3>

            {/* Standard Shipping */}
            <div
              onClick={() => setSelectedShipping("standard")}
              className={`p-4 rounded-xl border-2 mb-3 cursor-pointer transition-colors ${
                selectedShipping === "standard"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedShipping === "standard"
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedShipping === "standard" && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">จัดส่งปกติ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">5-7 วัน</span>
                  <span className="font-bold text-green-600">ฟรี</span>
                </div>
              </div>
            </div>

            {/* Express Shipping */}
            <div
              onClick={() => setSelectedShipping("express")}
              className={`p-4 rounded-xl border-2 mb-3 cursor-pointer transition-colors ${
                selectedShipping === "express"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedShipping === "express"
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedShipping === "express" && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">จัดส่งด่วน</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">1-2 วัน</span>
                  <span className="font-bold text-gray-900">฿50</span>
                </div>
              </div>
            </div>

            {deliveryDate && (
              <p className="text-xs text-gray-500 mb-3">
                จะจัดส่งให้ท่านใน{deliveryDate}
              </p>
            )}

            {/* Free Shipping Badge */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-700">จัดส่งฟรี</p>
                <p className="text-xs text-green-600">สำหรับสั่งซื้อตั้งแต่ 500 บาทขึ้นไป</p>
              </div>
>>>>>>> 4689f736d57fb7bdea1eb95cdd304939f1961f85
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
              จำนวน
            </h3>
            <QuantitySelector
              quantity={quantity}
              onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
              onIncrease={() => setQuantity(Math.min(product.stock, quantity + 1))}
              max={product.stock}
              disabled={product.stock === 0}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
          <button
            onClick={handleWishlist}
            className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={async () => {
              if (!token) {
                router.push("/login");
                return;
              }
              if (product.stock === 0) return;
              
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
            className="flex-1 h-14 rounded-xl font-bold text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            เพิ่มลงตะกร้า
          </button>
          <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className={`flex-1 h-14 rounded-xl font-bold text-lg transition-colors ${
              product.stock === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {product.stock === 0
              ? "สินค้าหมด"
              : loading
              ? "กำลังเพิ่ม..."
              : "ซื้อเลย"}
          </button>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<
  ProductPageProps
> = async ({ params, locale }) => {
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

  const trans = raw.translations[0];
  
  // Debug: Check what's in the database
  console.log("=== Server Side Debug ===");
  console.log("Product ID:", raw.id);
  console.log("Locale:", lang);
  console.log("Translations found:", raw.translations.length);
  console.log("Translation data:", trans);
  console.log("Material from DB:", trans?.material);
  
  return {
    props: {
      product: {
        id: raw.id,
        name: trans?.name ?? "",
        description: trans?.description ?? "",
        price: raw.price,
        salePrice: raw.salePrice,
        stock: raw.stock,
        imageUrl: raw.imageUrl,
        categoryId: raw.categoryId,
        material: trans?.material ?? null,
      },
    },
  };
};
