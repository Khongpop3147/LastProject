import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMemo, useState, ChangeEvent } from "react";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { Product, Category } from "@/types/product";

interface AllProductsProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  discount: boolean;
}

export default function AllProductsPage({
  products,
  categories,
  selectedCategory,
  discount,
}: AllProductsProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const updateQuery = (categoryId: string | null) => {
    const params = new URLSearchParams();
    if (discount) params.set("discount", "1");
    if (categoryId) params.set("category", categoryId);
    router.push(`/all-products?${params.toString()}`);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value || null;
    updateQuery(cat);
  };

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [products, searchTerm]
  );

  return (
    <Layout title={discount ? t("onSale") : t("allProducts")}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {discount ? t("onSale") : t("allProducts")}
          </h1>
          <p className="text-sm text-gray-500">{filtered.length} products</p>
        </div>

        <section className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={t("searchPlaceholder")}
              className="w-full border border-gray-200 rounded-lg p-2.5"
            />
            <div className="lg:hidden">
              <select
                value={selectedCategory ?? ""}
                onChange={handleCategoryChange}
                className="w-full border border-gray-200 rounded-lg p-2.5"
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden lg:flex flex-wrap gap-2">
            <button
              onClick={() => updateQuery(null)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                !selectedCategory
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              {t("allCategories")}
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateQuery(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  selectedCategory === c.id
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.length > 0 ? (
              filtered.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                {t("noProductsFound")}
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<AllProductsProps> = async ({
  query,
  locale,
}) => {
  const selectedCategory =
    typeof query.category === "string" ? query.category : null;
  const discount = query.discount === "1";
  const lang = locale || "th";

  const rawCategories = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale: lang },
        take: 1,
      },
    },
  });

  const categories: Category[] = rawCategories
    .map((c) => ({
      id: c.id,
      name: c.translations[0]?.name ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const whereClause: any = {};
  if (selectedCategory) whereClause.categoryId = selectedCategory;
  if (discount) whereClause.salePrice = { not: null };

  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      price: true,
      imageUrl: true,
      stock: true,
      salePrice: true,
      categoryId: true,
      isFeatured: true,
      translations: {
        where: { locale: lang },
        take: 1,
      },
    },
  });

  const products: Product[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.translations[0]?.name ?? "",
    description: p.translations[0]?.description ?? "",
    price: p.price,
    imageUrl: p.imageUrl,
    stock: p.stock,
    salePrice: p.salePrice,
    categoryId: p.categoryId ?? "",
    isFeatured: p.isFeatured,
  }));

  return {
    props: {
      products,
      categories,
      selectedCategory,
      discount,
    },
  };
};
