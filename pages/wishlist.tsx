// pages/wishlist.tsx
import { GetServerSideProps } from "next";
import useTranslation from "next-translate/useTranslation";
import Layout from "@/components/Layout";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { t } = useTranslation("common");

  return (
    <Layout title="รายการโปรด">
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          รายการโปรด
        </h1>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16">
          <Heart className="w-24 h-24 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            ยังไม่มีสินค้าในรายการโปรด
          </h2>
          <p className="text-gray-500 text-center mb-6">
            เพิ่มสินค้าที่คุณชอบเข้ารายการโปรดเพื่อดูภายหลัง
          </p>
          <a
            href="/all-products"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            เลือกซื้อสินค้า
          </a>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
