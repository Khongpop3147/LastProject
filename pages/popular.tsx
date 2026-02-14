import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type PopularPageProps = {
  products: Product[];
  title: string;
  introText: string;
};

export default function PopularPage({
  products,
  title,
  introText,
}: PopularPageProps) {
  return (
    <SimpleCollectionPage
      title={title}
      activePath="/"
      products={products}
      introText={introText}
      badgeMode="auto"
    />
  );
}

export const getServerSideProps: GetServerSideProps<PopularPageProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";
  const copy =
    lang === "en"
      ? {
          title: "Most Popular",
          introText: "Top products customers order most frequently right now.",
        }
      : {
          title: "ได้รับความนิยมสูง",
          introText: "สินค้าที่ลูกค้าสั่งซื้อบ่อยที่สุดในช่วงนี้",
        };

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
      .map((item) => mapToProduct(item, lang));
  } else {
    const fallback = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 24,
      include: {
        translations: { where: { locale: lang }, take: 1 },
      },
    });
    products = fallback.map((item) => mapToProduct(item, lang));
  }

  return {
    props: {
      products,
      title: copy.title,
      introText: copy.introText,
    },
  };
};
