import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type RecommendedPageProps = {
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

export default function RecommendedPage({ products }: RecommendedPageProps) {
  return (
    <SimpleCollectionPage
      title="สินค้าแนะนำ"
      activePath="/"
      products={products}
      introText="สินค้ายอดนิยมที่คัดสรรมาเพื่อคุณภาพ รีวิวและความพึงพอใจของลูกค้า"
      badgeMode="auto"
    />
  );
}

export const getServerSideProps: GetServerSideProps<
  RecommendedPageProps
> = async ({ locale }) => {
  const lang = locale ?? "th";

  let raw = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { updatedAt: "desc" },
    take: 24,
    include: {
      translations: { where: { locale: lang }, take: 1 },
    },
  });

  if (raw.length === 0) {
    raw = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 24,
      include: {
        translations: { where: { locale: lang }, take: 1 },
      },
    });
  }

  return {
    props: {
      products: raw.map(toProduct),
    },
  };
};
