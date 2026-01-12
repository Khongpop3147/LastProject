// components/ProductOptions.tsx
"use client";

import { Check } from "lucide-react";

export interface ProductOption {
  id: string;
  label: string;
  value: string;
  color?: string; // สำหรับแสดงสี (ถ้าเป็นตัวเลือกสี)
  disabled?: boolean;
}

interface ProductOptionsProps {
  title: string; // เช่น "เลือกสี" หรือ "เลือกสูตร"
  options: ProductOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  type?: "color" | "text"; // แสดงเป็นกล่องสี หรือ ปุ่มข้อความ
}

export default function ProductOptions({
  title,
  options,
  selectedValue,
  onSelect,
  type = "text"
}: ProductOptionsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{title}</h3>
      
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isDisabled = option.disabled;

          if (type === "color") {
            // แสดงเป็นกล่องสี
            return (
              <button
                key={option.id}
                onClick={() => !isDisabled && onSelect(option.value)}
                disabled={isDisabled}
                className={`relative w-14 h-14 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-600 scale-110"
                    : isDisabled
                    ? "border-gray-200 opacity-40 cursor-not-allowed"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: option.color || "#ccc" }}
                title={option.label}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-md" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          }

          // แสดงเป็นปุ่มข้อความ
          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && onSelect(option.value)}
              disabled={isDisabled}
              className={`relative px-5 py-3 rounded-lg border-2 font-semibold text-base transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : isDisabled
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {option.label}
              {isSelected && (
                <Check className="absolute top-1 right-1 w-4 h-4 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
