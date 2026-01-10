// pages/products/[id].tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Product as ProductType } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface ProductPageProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice: number | null;
    stock: number;
    imageUrl: string | null;
  } | null;
}

export default function ProductPage({ product }: ProductPageProps) {
  const { t, lang } = useTranslation("common");
  const router = useRouter();
  const { token } = useAuth();

  if (!product) {
    return (
      <Layout title={t("notFound")}>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-semibold">{t("productNotFound")}</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← {t("backHome")}
          </Link>
        </div>
      </Layout>
    );
  }

  const [qty, setQty] = useState(product.stock > 0 ? 1 : 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product.stock === 0) {
      setQty(0);
      setError(t("outOfStock"));
    } else {
      if (qty < 1) setQty(1);
      if (qty > product.stock) {
        setQty(product.stock);
        setError(t("maxQty", { count: product.stock }));
      } else {
        setError("");
      }
    }
  }, [qty, product.stock, t]);

  const addToCart = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (error || product.stock === 0) return;
    setLoading(true);
    try {
      const cartRes = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cartRes.ok) throw new Error(t("cartFetchError"));
      const { items } = await cartRes.json();
      const inCart = items.find((i: any) => i.productId === product.id);
      const current = inCart?.quantity ?? 0;
      if (current + qty > product.stock) {
        setError(t("maxInCart", { stock: product.stock, current }));
        setLoading(false);
        return;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      if (!res.ok) throw new Error(t("addCartError"));
      router.push("/cart");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={product.name}>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            <img
              src={product.imageUrl || "/images/placeholder.png"}
              alt={product.name}
              className="w-full h-auto object-cover rounded"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            {product.salePrice != null ? (
              <div className="mb-4">
                <span className="text-2xl text-red-600 font-bold mr-2">
                  ฿{product.salePrice}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ฿{product.price}
                </span>
              </div>
            ) : (
              <p className="text-xl text-green-700 mb-4">฿{product.price}</p>
            )}
            <p className="mb-4">
              {t("stock")}: {product.stock}
            </p>
            {product.stock === 0 ? (
              <p className="text-red-600 font-semibold">{t("outOfStock")}</p>
            ) : (
              <div className="mb-4">
                <label className="block mb-1">{t("quantity")}:</label>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-20 border rounded px-2 py-1 text-center"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
            )}
            <button
              onClick={addToCart}
              disabled={loading || !!error || product.stock === 0}
              className={`px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${
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
            <div className="mt-4">
              <Link href="/" className="text-blue-600 hover:underline">
                ← {t("backHome")}
              </Link>
            </div>
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
      },
    },
  };
};
