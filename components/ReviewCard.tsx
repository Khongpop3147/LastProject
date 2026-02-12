// components/ReviewCard.tsx
"use client";

import { Star } from "lucide-react";

interface ReviewCardProps {
  userName: string;
  rating: number;
  comment: string;
  timeAgo: string;
  userAvatar?: string;
}

export default function ReviewCard({
  userName,
  rating,
  comment,
  timeAgo,
  userAvatar
}: ReviewCardProps) {
  return (
    <div className="mb-3 rounded-2xl bg-[#e6ebf3] p-4">
      <div className="mb-2 flex items-start gap-3">
        {/* User Avatar */}
        <div 
          className="h-11 w-11 flex-shrink-0 rounded-full"
          style={{ 
            background: userAvatar || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
          }}
        />
        
        <div className="flex-1">
          {/* User Name & Time */}
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[22px] font-semibold text-gray-900">{userName}</span>
            <span className="text-[19px] text-gray-500">{timeAgo}</span>
          </div>
          
          {/* Rating Stars */}
          <div className="mb-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-300 text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Comment */}
      <p className="text-[20px] leading-relaxed text-gray-700">{comment}</p>
    </div>
  );
}
