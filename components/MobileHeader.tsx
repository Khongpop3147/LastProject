// components/MobileHeader.tsx
"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MobileHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-white shadow-md" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="relative w-12 h-12">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหา สินค้า"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-blue-50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-blue-100 transition-all border border-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
