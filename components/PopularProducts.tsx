// components/PopularProducts.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

interface PopularProductsProps {
  products?: (Product & { stock: number })[];
}

export default function PopularProducts({ products = [] }: PopularProductsProps) {
  // แสดงแค่ 5 สินค้าแรก
  const displayProducts = products.slice(0, 5);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {displayProducts.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
            <Image
              src={product.imageUrl ?? "/images/placeholder.png"}
              alt={product.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
