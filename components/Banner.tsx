"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

  return (
    <div className="my-4 relative w-full h-32 md:h-48 lg:h-64 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500">
      {/* Background Image */}
      <Image
        src={slides[idx].img}
        alt={slides[idx].title}
        fill
        className="object-cover"
      />

      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center px-6">
        <div className="text-white max-w-[60%]">
          <h2 className="font-bold text-xl md:text-2xl lg:text-3xl mb-1">{slides[idx].title}</h2>
          <p className="text-sm md:text-base mb-2">{slides[idx].sub}</p>
          <button className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
            Happening Now
          </button>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-blue-600" : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
