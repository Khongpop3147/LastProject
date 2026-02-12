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
      <h3 className="mb-3 text-[22px] font-extrabold text-[#111827]">{title}</h3>
      
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
                className={`relative h-[56px] w-[56px] rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[#2f6ef4]"
                    : isDisabled
                    ? "border-gray-200 opacity-40 cursor-not-allowed"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: option.color || "#ccc" }}
                title={option.label}
                aria-label={`เลือกสี ${option.label}`}
              >
                {isSelected && (
                  <div className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-[#2f6ef4] shadow">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
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
              className={`relative min-w-[50px] rounded-xl border-2 px-3 py-2 text-[16px] font-semibold leading-none transition-all ${
                isSelected
                  ? "border-[#2f6ef4] bg-[#e9f0ff] text-[#2f6ef4]"
                  : isDisabled
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-[#d1d5db] bg-white text-[#1f2937] hover:border-gray-400"
              }`}
              aria-label={`เลือกขนาด ${option.label}`}
            >
              {option.label}
              {isSelected && (
                <Check className="absolute right-1 top-1 h-4 w-4 text-[#2f6ef4]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
