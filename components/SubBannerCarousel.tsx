// components/SubBannerCarousel.tsx
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SubBannerSlide {
  title: string;
  sub: string;
  img: string;
}

interface SubBannerCarouselProps {
  slides: SubBannerSlide[];
}

export default function SubBannerCarousel({ slides }: SubBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div 
      className="relative rounded-2xl overflow-hidden h-32 md:h-40 bg-gradient-to-r from-green-600 to-green-700 bg-cover bg-center transition-all duration-500"
      style={currentSlide.img ? { backgroundImage: `url(${currentSlide.img})` } : undefined}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      
      <div className="relative h-full flex items-center justify-between px-4 md:px-6">
        {/* Left Content */}
        <div className="flex-1 text-white z-10">
          <p className="text-sm md:text-base opacity-90 mb-1"></p>
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1">{currentSlide.title}</h2>
          <p className="text-sm md:text-base opacity-90 mb-2">{currentSlide.sub}</p>
          
          {/* Dots indicator */}
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex 
                    ? "w-6 bg-white" 
                    : "w-1 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/25 hover:bg-white/35 rounded-full flex items-center justify-center transition-colors z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button 
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/25 hover:bg-white/35 rounded-full flex items-center justify-center transition-colors z-20"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
