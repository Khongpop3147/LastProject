import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type PopularPageProps = {
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

export default function PopularPage({ products }: PopularPageProps) {
  return (
    <SimpleCollectionPage
      title="ได้รับความนิยมสูง"
      activePath="/"
      products={products}
      introText="สินค้าที่ลูกค้าสั่งซื้อบ่อยที่สุดในช่วงนี้"
      badgeMode="auto"
    />
  );
}

export const getServerSideProps: GetServerSideProps<PopularPageProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  const ranked = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 24,
  });

  let products: Product[] = [];

  if (ranked.length > 0) {
    const ids = ranked.map((r) => r.productId);
    const raw = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        translations: { where: { locale: lang }, take: 1 },
      },
    });
    const byId = new Map(raw.map((p) => [p.id, p]));
    products = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(toProduct);
  } else {
    const fallback = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 24,
      include: {
        translations: { where: { locale: lang }, take: 1 },
      },
    });
    products = fallback.map(toProduct);
  }

  return {
    props: { products },
  };
};
