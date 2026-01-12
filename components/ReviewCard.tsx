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
    <div className="bg-gray-50 rounded-xl p-4 mb-3">
      <div className="flex items-start gap-3 mb-2">
        {/* User Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ 
            background: userAvatar || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
          }}
        />
        
        <div className="flex-1">
          {/* User Name & Time */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900">{userName}</span>
            <span className="text-sm text-gray-500">{timeAgo}</span>
          </div>
          
          {/* Rating Stars */}
          <div className="flex gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
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
      <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>
    </div>
  );
}
