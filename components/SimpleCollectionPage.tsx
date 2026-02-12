import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { goBackOrPush } from "@/lib/navigation";
import type { Product } from "@/types/product";

type BadgeMode = "auto" | "sale" | "new";

type SimpleCollectionPageProps = {
  title: string;
  activePath: string;
  products: Product[];
  introText?: string;
  badgeMode?: BadgeMode;
};

const cardBackgrounds = [
  "bg-gradient-to-br from-orange-400 to-orange-500",
  "bg-gradient-to-br from-pink-300 to-rose-300",
  "bg-gradient-to-br from-cyan-400 to-sky-500",
  "bg-gradient-to-br from-red-400 to-orange-500",
  "bg-gradient-to-br from-amber-300 to-orange-300",
  "bg-gradient-to-br from-fuchsia-300 to-pink-300",
  "bg-gradient-to-br from-gray-200 to-gray-300",
  "bg-gradient-to-br from-slate-200 to-slate-300",
  "bg-gradient-to-br from-lime-300 to-green-400",
  "bg-gradient-to-br from-zinc-300 to-zinc-400",
];

function resolveBadge(mode: BadgeMode, product: Product, idx: number) {
  if (mode === "sale") return "sale";
  if (mode === "new") return "new";

  const hasDiscount =
    typeof product.salePrice === "number" && product.salePrice < product.price;
  if (hasDiscount) return "sale";
  return idx % 2 === 0 ? "new" : null;
}

export default function SimpleCollectionPage({
  title,
  activePath,
  products,
  introText,
  badgeMode = "auto",
}: SimpleCollectionPageProps) {
  const router = useRouter();

  const handleBack = () => {
    goBackOrPush(router, "/");
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen bg-[#f3f3f4] text-[#111827]">
        <div className="mx-auto w-full max-w-[440px]">
          <header className="sticky top-0 z-40 border-b border-[#cfcfd2] bg-[#f3f3f4]">
            <div className="flex h-[80px] items-center px-4">
              <button
                type="button"
                aria-label="ย้อนกลับ"
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce1ea] text-[#222b3a]"
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
              </button>

              <h1 className="ml-4 text-[28px] font-extrabold leading-none tracking-tight text-black">
                {title}
              </h1>
            </div>
          </header>

          <main className="px-4 pb-[102px] pt-3">
            {introText ? (
              <div className="mb-4 rounded-2xl bg-[#eadbc4] px-4 py-3 text-[16px] text-[#7a6543]">
                {introText}
              </div>
            ) : null}

            <p className="mb-3 text-[17px] text-[#9d8ca2]">
              ทั้งหมด <span className="text-[36px] font-bold text-[#2f2f2f]">{products.length}</span> รายการ
            </p>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cccccc] bg-white p-6 text-center text-[#6b7280]">
                ยังไม่มีสินค้าในหมวดนี้
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    backgroundColor={cardBackgrounds[idx % cardBackgrounds.length]}
                    showBadge={resolveBadge(badgeMode, product, idx)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        <MobileShopBottomNav activePath={activePath} />
      </div>
    </>
  );
}
