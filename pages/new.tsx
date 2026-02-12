import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type NewPageProps = {
  products: Product[];
};

function toProduct(raw: any): Product {
  return {
    id: raw.id,
    name: raw.translations[0]?.name ?? "สินค้า",
    description: raw.translations[0]?.description ?? "",
    price: raw.price,
    imageUrl: raw.imageUrl,
    stock: raw.stock,
    salePrice: raw.salePrice ?? null,
    categoryId: raw.categoryId ?? undefined,
    isFeatured: raw.isFeatured,
  };
}

export default function NewProductsPage({ products }: NewPageProps) {
  return (
    <SimpleCollectionPage
      title="สินค้าใหม่"
      activePath="/"
      products={products}
      introText="อัปเดตสินค้ามาใหม่ล่าสุด คัดมาให้เลือกก่อนใคร"
      badgeMode="new"
    />
  );
}

export const getServerSideProps: GetServerSideProps<NewPageProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  const raw = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      translations: { where: { locale: lang }, take: 1 },
    },
  });

  return {
    props: {
      products: raw.map(toProduct),
    },
  };
};
