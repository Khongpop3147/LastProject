import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  clearWishlist,
  getWishlistItems,
  removeFromWishlist,
  subscribeWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

export default function WishlistPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getWishlistItems(user?.id));
    sync();
    return subscribeWishlist(sync);
  }, [user?.id]);

  const totalItems = useMemo(() => items.length, [items]);

  return (
    <Layout title={t("wishlist.title") || "Wishlist"}>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("wishlist.title") || "Wishlist"}
            </h1>
            <p className="text-gray-500 mt-1">
              {totalItems} {t("unit.items") || "items"}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => clearWishlist(user?.id)}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              {t("wishlist.clearAll") || "Clear all"}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Heart className="w-24 h-24 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t("wishlist.emptyTitle") || "No items in wishlist yet"}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {t("wishlist.emptyDesc") || "Save products you like to view them later."}
            </p>
            <Link
              href="/all-products"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("wishlist.browse") || "Browse products"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((item) => {
              const hasDiscount = item.salePrice != null && item.salePrice < item.price;
              const displayPrice = hasDiscount ? item.salePrice : item.price;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <Link href={`/products/${item.id}`}>
                    <div className="relative w-full aspect-square">
                      <Image
                        src={item.imageUrl || "/images/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/products/${item.id}`}>
                      <h2 className="text-sm md:text-base font-medium text-gray-900 line-clamp-2 min-h-[40px]">
                        {item.name}
                      </h2>
                    </Link>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-blue-600 font-bold">
                        ฿{Number(displayPrice || 0).toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          ฿{Number(item.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(item.id, user?.id)}
                      className="mt-3 w-full h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t("wishlist.remove") || "Remove"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

