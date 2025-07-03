// components/search/PropertyCard.tsx
"use client";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  image: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  distance: string | number;
};

export default function PropertyCard({
  image,
  title,
  location,
  price,
  rating,
  distance
}: Props) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md bg-white dark:bg-[#0B1D39] duration-500 transition-all min-h-[300px] ease-in-out hover:scale-[1.01]">
      <div className="relative w-full h-60">
        <Image src={image} alt={title} fill className="object-cover" />
        <div className="absolute top-3 right-3 bg-white/70 dark:bg-white/10 backdrop-blur-sm p-1 rounded-full cursor-pointer">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div className="absolute top-3 left-3 bg-green-500 text-white font-bold text-sm px-3 py-1 rounded-full">
          ${price}
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
          {distance}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          {rating}
        </div>
      </div>

      <div className="p-3 flex justify-between items-center text-[#182A47] dark:text-[#C2F2FF]">
        <div>
          <p className="font-semibold text-sm">{location}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {title}
          </p>
        </div>

        <Link href="" className="text-blue-600 text-sm font-medium">
          View details
        </Link>
      </div>
    </div>
  );
}
