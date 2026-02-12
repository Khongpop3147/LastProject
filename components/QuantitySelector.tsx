// components/QuantitySelector.tsx
"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  min = 1,
  max = 999,
  disabled = false
}: QuantitySelectorProps) {
  const canDecrease = quantity > min && !disabled;
  const canIncrease = quantity < max && !disabled;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label="ลดจำนวนสินค้า"
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
          canDecrease
            ? "border-blue-600 text-blue-600 hover:bg-blue-50"
            : "border-gray-300 text-gray-300 cursor-not-allowed"
        }`}
      >
        <Minus className="h-5 w-5" />
      </button>

      <span className="min-w-[64px] text-center text-[24px] font-bold text-gray-900">
        {quantity}
      </span>

      <button
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label="เพิ่มจำนวนสินค้า"
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
          canIncrease
            ? "border-blue-600 text-blue-600 hover:bg-blue-50"
            : "border-gray-300 text-gray-300 cursor-not-allowed"
        }`}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
