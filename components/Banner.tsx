"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BannerSlide {
  title: string;
  sub: string;
  img: string;
}

interface BannerProps {
  slides: BannerSlide[];
  isPromotion?: boolean;
}

export default function Banner({ slides, isPromotion = false }: BannerProps) {
  if (!slides || slides.length === 0) return null;

  const [idx, setIdx] = useState(0);
  const total = slides.length;

  // auto-slide every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, 7000);
    return () => clearInterval(timer);
  }, [total]);

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="my-4 relative w-full h-52 md:h-64 lg:h-72 overflow-hidden rounded-2xl bg-gray-100 shadow-md">
      {slides.map((slide, i) => {
        const active = i === idx;
        return (
          <div
            key={`${slide.img}-${i}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden md:flex min-h-0 absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/30 backdrop-blur-sm text-white items-center justify-center hover:bg-white/40 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden md:flex min-h-0 absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/30 backdrop-blur-sm text-white items-center justify-center hover:bg-white/40 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`min-h-0 h-2 rounded-full transition-all duration-500 ${
              i === idx ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
