// components/SubBanner.tsx
"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SubBannerProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  img: string;
}

export default function SubBanner({
  title,
  description,
  buttonText,
  buttonLink,
  img,
}: SubBannerProps) {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden h-32 md:h-40 bg-cover bg-center"
      style={{ backgroundImage: `url(${img || "/images/placeholder.png"})` }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      
      <div className="relative h-full flex items-center justify-between px-4 md:px-6">
        {/* Left Content */}
        <div className="flex-1 text-white z-10">
          <p className="text-sm md:text-base opacity-95 mb-1">{buttonText || "Recommended for you"}</p>
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1">{title}</h2>
          <p className="text-sm md:text-base opacity-90 mb-2">{description}</p>
          {/* Dots indicator */}
          <div className="flex gap-1.5">
            <div className="w-6 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/25 hover:bg-white/35 rounded-full flex items-center justify-center transition-colors z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/25 hover:bg-white/35 rounded-full flex items-center justify-center transition-colors z-20"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
