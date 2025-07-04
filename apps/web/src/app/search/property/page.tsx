"use client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FullPropertyProps } from "public/mock-data";
import { MOCK_PROPERTIES } from "public/mock-data";

export default function PropertyDetailPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const [property, setProperty] = useState<FullPropertyProps | null>(null);

  useEffect(() => {
    if (propertyId) {
      const match = MOCK_PROPERTIES.find((p) => p.id === propertyId);
      setProperty(match || null);
    }
  }, [propertyId]);

  if (!property) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">Property not found.</p>
      </div>
    );
  }

  return (
    <main className="px-4 pb-16 pt-20 max-w-6xl mx-auto text-[#182A47] dark:text-[#C2F2FF]">
      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4 auto-rows-[150px] sm:auto-rows-[200px]">
        {property.images.map((img, index) => (
          <div
            key={property.id}
            className={`relative overflow-hidden rounded-xl ${
              index === 0
                ? "col-span-2 row-span-2 sm:row-span-2 sm:col-span-2"
                : ""
            }`}
          >
            <Image
              width={300}
              height={300}
              src={img}
              alt={`${property.title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Property details */}
      <div className="mt-6 space-y-2">
        <h1 className="text-2xl font-bold">{property.title}</h1>
        <p className="text-muted-foreground">{property.location}</p>
        <p>Rating: ⭐ {property.rating}</p>
        <p className="text-lg font-semibold text-primary">${property.price}</p>
        <p>Amenities: {property.amenities.join(", ")}</p>
      </div>

      <button
        type="button"
        onClick={() => window.history.back()}
        className="mt-4 text-sm underline text-blue-600"
      >
        ← Back to Search
      </button>
    </main>
  );
}
