"use client";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import PropertyCard from "./PropertyCard";
import type { FullPropertyProps } from "public/mock-data";

type Props = {
  properties: FullPropertyProps[];
  onLoadMore: () => void;
};

export default function PropertyGrid({ properties, onLoadMore }: Props) {
  const { ref, inView } = useInView({
    threshold: 1
  });

  useEffect(() => {
    if (inView) {
      onLoadMore(); // Called when scroll reaches bottom
    }
  }, [inView, onLoadMore]);

  if (properties.length < 1) {
    return (
      <div className="w-full h-full grid place-items-center text-2xl font-bold text-white">
        No Properties found
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:mt-8 md:pb-32">
        {properties.map((property, i) => (
          <PropertyCard key={property.id || i} {...property} />
        ))}
      </div>

      {/* Observer div for triggering infinite scroll */}
      <div ref={ref} className="h-10" />
    </>
  );
}
