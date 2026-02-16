// components/SubBannerCarousel.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
  const total = slides?.length ?? 0;

  useEffect(() => {
    if (total <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [total]);

  useEffect(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev >= total ? 0 : prev));
  }, [total]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  if (total === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative rounded-xl overflow-hidden h-28 md:h-36 shadow-md">
      {slides.map((slide, index) => {
        const active = index === currentIndex;
        // Only render active and adjacent slides to avoid loading all images
        const adjacent =
          index === (currentIndex + 1) % total ||
          index === (currentIndex - 1 + total) % total;
        if (!active && !adjacent) return null;
        return (
          <div
            key={`${slide.img}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            {slide.img ? (
              <Image
                src={slide.img}
                alt={slide.title || `sub-banner-${index}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
            ) : null}
          </div>
        );
      })}

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>

      <div className="relative h-full flex items-center justify-between px-4 md:px-6">
        {/* Left Content */}
        <div
          key={currentIndex}
          className="flex-1 text-white z-10 animate-fade-in"
        >
          <h2 className="text-base md:text-xl lg:text-2xl font-bold mb-1">
            {currentSlide.title}
          </h2>
          <p className="text-xs md:text-sm opacity-90 mb-2">
            {currentSlide.sub}
          </p>

          {/* Dots indicator */}
          <div className="flex gap-2 items-center">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to sub banner ${index + 1}`}
                className={`min-h-0 h-1.5 rounded-full transition-all duration-400 flex-shrink-0 ${
                  index === currentIndex
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 min-h-0 w-8 h-8 bg-white/30 hover:bg-white/40 rounded-lg flex items-center justify-center transition-colors z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 min-h-0 w-8 h-8 bg-white/30 hover:bg-white/40 rounded-lg flex items-center justify-center transition-colors z-20"
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
