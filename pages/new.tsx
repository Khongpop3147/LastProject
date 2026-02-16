import type { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import type { Product } from "@/types/product";
import SimpleCollectionPage from "@/components/SimpleCollectionPage";

type NewPageProps = {
  products: Product[];
  title: string;
  introText: string;
};

export default function NewProductsPage({
  products,
  title,
  introText,
}: NewPageProps) {
  return (
    <SimpleCollectionPage
      title={title}
      activePath="/"
      products={products}
      introText={introText}
      badgeMode="new"
    />
  );
}

export const getServerSideProps: GetServerSideProps<NewPageProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";
  const copy =
    lang === "en"
      ? {
          title: "New Arrivals",
          introText: "Freshly updated products, selected for you first.",
        }
      : {
          title: "สินค้าใหม่",
          introText: "อัปเดตสินค้ามาใหม่ล่าสุด คัดมาให้เลือกก่อนใคร",
        };

  const raw = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      translations: { where: { locale: lang }, take: 1 },
    },
  });

  return {
    props: {
      products: raw.map((item) => mapToProduct(item, lang)),
      title: copy.title,
      introText: copy.introText,
    },
  };
};
