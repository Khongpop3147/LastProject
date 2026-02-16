import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type RecommendedPageProps = {
  products: Product[];
  title: string;
  introText: string;
};

export default function RecommendedPage({
  products,
  title,
  introText,
}: RecommendedPageProps) {
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

export const getServerSideProps: GetServerSideProps<
  RecommendedPageProps
> = async ({ locale }) => {
  const lang = locale ?? "th";
  const copy =
    lang === "en"
      ? {
          title: "Recommended",
          introText:
            "Curated products with strong quality and customer satisfaction.",
        }
      : {
          title: "สินค้าแนะนำ",
          introText:
            "สินค้ายอดนิยมที่คัดสรรมาเพื่อคุณภาพ รีวิวและความพึงพอใจของลูกค้า",
        };

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
      products: raw.map((item) => mapToProduct(item, lang)),
      title: copy.title,
      introText: copy.introText,
    },
  };
};
