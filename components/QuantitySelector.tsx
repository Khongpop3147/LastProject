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
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
          canDecrease
            ? "border-blue-600 text-blue-600 hover:bg-blue-50"
            : "border-gray-300 text-gray-300 cursor-not-allowed"
        }`}
      >
        <Minus className="w-5 h-5" />
      </button>

      <span className="text-2xl md:text-3xl font-bold text-gray-900 min-w-[60px] text-center">
        {quantity}
      </span>

      <button
        onClick={onIncrease}
        disabled={!canIncrease}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
          canIncrease
            ? "border-blue-600 text-blue-600 hover:bg-blue-50"
            : "border-gray-300 text-gray-300 cursor-not-allowed"
        }`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
