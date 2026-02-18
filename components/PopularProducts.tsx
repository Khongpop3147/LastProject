// components/PopularProducts.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

interface PopularProductsProps {
  products?: (Product & { stock?: number })[];
}

function extractFirstImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "/images/placeholder.png";

  const raw = imageUrl.trim();
  if (!raw) return "/images/placeholder.png";

  // Try to parse as JSON array
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = String(parsed[0] || "").trim();
        if (first) return first;
      }
    } catch {
      // fallback below
    }
  }

  // Try to split by common delimiters
  const byDelimiter = raw
    .split(/\r?\n|\s*\|\s*|\s*;\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (byDelimiter.length > 0) {
    return byDelimiter[0];
  }

  return raw;
}

export default function PopularProducts({
  products = [],
}: PopularProductsProps) {
  const displayProducts = products.slice(0, 8);

  // Debug: Log product image URLs
  console.log('PopularProducts - Products:', displayProducts.map(p => ({
    name: p.name,
    imageUrl: p.imageUrl,
    extracted: extractFirstImage(p.imageUrl)
  })));


  return (
    <>
      {/* Mobile: รูปวงกลม 2 แถว */}
      <div className="grid grid-cols-4 gap-3 md:hidden">
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex flex-col items-center group"
          >
            <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 transition-all duration-300 group-hover:border-blue-500 group-hover:scale-110 group-hover:shadow-lg">
              <Image
                src={extractFirstImage(product.imageUrl)}
                alt={product.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="overflow-safe line-clamp-2 text-center text-xs font-medium text-gray-700 transition-colors duration-300 group-hover:text-blue-600">
              {product.name}
            </p>
          </Link>
        ))}
      </div>

      {/* Desktop: การ์ดเต็มรูปแบบ */}
      <div className="hidden grid-cols-4 gap-5 md:grid lg:grid-cols-8">
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group flex h-full flex-col"
          >
            <div className="relative mb-3 aspect-square w-full flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-xl group-hover:-translate-y-1">
              <Image
                src={extractFirstImage(product.imageUrl)}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 25vw, 12.5vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="flex flex-grow flex-col justify-between">
              <h3 className="overflow-safe mb-2 min-h-[3rem] line-clamp-2 text-base font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                {product.name}
              </h3>

              <div className="flex flex-wrap items-baseline gap-2">
                {product.salePrice ? (
                  <>
                    <span className="text-lg font-bold text-red-600">
                      ฿{product.salePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ฿{product.price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    ฿{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
