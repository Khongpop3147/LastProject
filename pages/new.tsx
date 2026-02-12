import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type NewPageProps = {
  products: Product[];
};

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
      products: raw.map(mapToProduct),
    },
  };
};
