// pages/all-products.tsx
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState, ChangeEvent } from "react";
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

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    const params = new URLSearchParams();
    if (discount) params.set("discount", "1");
    if (cat) params.set("category", cat);
    router.push(`/all-products?${params.toString()}`);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title={discount ? t("onSale") : t("allProducts")}>
      <h1 className="text-3xl font-bold mb-4">
        {discount ? t("onSale") : t("allProducts")}
      </h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder={t("searchPlaceholder")}
          className="flex-1 border rounded p-2"
        />
        <select
          value={selectedCategory ?? ""}
          onChange={handleCategoryChange}
          className="border rounded p-2"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {filtered.length > 0 ? (
          filtered.map((p) => <ProductCard key={p.id} product={p} />)
        ) : (
          <p className="col-span-full text-center text-gray-500">
            {t("noProductsFound")}
          </p>
        )}
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

  // 1) ดึงหมวดหมู่พร้อม translation ตามภาษาที่เลือก
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

  // 2) สร้างเงื่อนไขการค้นหาสินค้า
  const whereClause: any = {};
  if (selectedCategory) whereClause.categoryId = selectedCategory;
  if (discount) whereClause.salePrice = { not: null };

  // 3) ดึงสินค้า พร้อม translation
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
