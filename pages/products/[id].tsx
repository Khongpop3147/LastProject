import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowLeft, Heart, Share2, Star, Package, Check, ShoppingCart } from "lucide-react";
import Layout from "@/components/Layout";
import QuantitySelector from "@/components/QuantitySelector";
import ReviewCard from "@/components/ReviewCard";
import { prisma } from "@/lib/prisma";
import { useAuth } from "@/context/AuthContext";
import { calculateDeliveryDate } from "@/lib/shippingUtils";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";

interface ProductPageProps {
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
  const router = useRouter();
  const { token, user } = useAuth();

  const [selectedShipping, setSelectedShipping] = useState<"standard" | "express">("standard");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [distanceKm] = useState(100);

  useEffect(() => {
    const date = calculateDeliveryDate(selectedShipping, distanceKm);
    setDeliveryDate(date);
  }, [selectedShipping, distanceKm]);

  useEffect(() => {
    if (!product?.id) return;
    setIsWishlisted(isInWishlist(product.id, user?.id));
  }, [product?.id, user?.id]);

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

  const hasDiscount = !!(product.salePrice && product.salePrice < product.price);
  const displayPrice = product.salePrice || product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const mockRating = 4.9;
  const mockReviewCount = 219;
  const mockReviewCards = [
    {
      id: "1",
      userName: "Somsri M.",
      rating: 5,
      comment:
        "Excellent quality and reliable shipping. The texture and material are exactly as described.",
      timeAgo: "2 days ago",
      avatar: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "2",
      userName: "Nok P.",
      rating: 4,
      comment: "Good value for money and well-packed package.",
      timeAgo: "2 days ago",
      avatar: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
  ];

  const requireLogin = () => {
    if (!token) {
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleWishlist = () => {
    if (!product) return;
    const next = toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
    }, user?.id);
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
      if (redirect === "none") alert("Added to cart");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={product.name} hideBottomNav>
      <div className="min-h-screen bg-gray-50 pb-28 md:pb-8">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 md:hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleWishlist}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
                  }`}
                />
              </button>
              <button
                onClick={() => router.push("/cart")}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start">
            <div className="space-y-4">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-md">
                <Image
                  src={product.imageUrl || "/images/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {hasDiscount && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((thumb) => (
                  <div
                    key={thumb}
                    className="aspect-square rounded-xl bg-white border border-gray-200 overflow-hidden"
                  >
                    <Image
                      src={product.imageUrl || "/images/placeholder.png"}
                      alt={`${product.name} thumbnail ${thumb}`}
                      width={240}
                      height={240}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5 md:sticky md:top-24">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="mb-2">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl lg:text-4xl font-bold text-blue-600">
                        THB {displayPrice.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-400 line-through">
                        THB {product.price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl lg:text-4xl font-bold text-blue-600">
                      THB {displayPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-gray-900">{mockRating}</span>
                  <span className="text-sm text-gray-500">({mockReviewCount} reviews)</span>
                </div>

                <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>

                {product.material && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Material</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.material.split(",").map((mat, idx) => (
                        <span key={`${mat.trim()}-${idx}`} className="px-3 py-1.5 bg-pink-50 text-sm text-gray-700 rounded-lg">
                          {mat.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Shipping</h3>

                <button
                  onClick={() => setSelectedShipping("standard")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedShipping === "standard"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
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
                      <span className="font-semibold text-gray-900">Standard Delivery</span>
                    </div>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedShipping("express")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedShipping === "express"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
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
                      <span className="font-semibold text-gray-900">Express Delivery</span>
                    </div>
                    <span className="font-semibold text-gray-900">THB 50</span>
                  </div>
                </button>

                {deliveryDate && (
                  <p className="text-sm text-gray-500">Estimated delivery: {deliveryDate}</p>
                )}

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">Free shipping available</p>
                    <p className="text-xs text-green-600">Orders above THB 500</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantity</h3>
                  <QuantitySelector
                    quantity={quantity}
                    onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                    onIncrease={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    max={product.stock}
                    disabled={product.stock === 0}
                  />
                </div>

                <div className="hidden md:grid md:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => addToCart("none")}
                    className="h-12 rounded-xl font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => addToCart("checkout")}
                    disabled={loading || product.stock === 0}
                    className={`h-12 rounded-xl font-semibold text-white transition-colors ${
                      product.stock === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {product.stock === 0 ? "Out of stock" : loading ? "Processing..." : "Buy now"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-8 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
              <button className="text-blue-600 text-sm font-semibold hover:underline">Write review</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            </div>

            <button className="mt-4 w-full md:w-auto px-5 py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
              View all reviews
            </button>
          </section>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
          <button
            onClick={handleWishlist}
            className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl border-2 border-gray-300"
          >
            <Heart
              className={`w-6 h-6 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>

          <button
            onClick={() => addToCart("none")}
            className="flex-1 h-14 rounded-xl font-bold text-base border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Add to Cart
          </button>

          <button
            onClick={() => addToCart("checkout")}
            disabled={loading || product.stock === 0}
            className={`flex-1 h-14 rounded-xl font-bold text-base transition-colors ${
              product.stock === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {product.stock === 0 ? "Out" : loading ? "Adding..." : "Buy Now"}
          </button>
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

  const trans = raw.translations[0];

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
