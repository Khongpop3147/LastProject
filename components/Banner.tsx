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

  // auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total]);

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="my-4 relative w-full h-64 md:h-72 lg:h-80 overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5 shadow-lg">
      <Image
        src={slides[idx].img}
        alt={slides[idx].title}
        fill
        className="object-cover scale-[1.02]"
      />

      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white items-center justify-center hover:bg-white/30 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white items-center justify-center hover:bg-white/30 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${
              i === idx ? "w-2.5 h-2.5 bg-white" : "w-1.5 h-1.5 bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
