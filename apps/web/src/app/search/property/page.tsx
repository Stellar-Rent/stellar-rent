"use client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type FullProperyProps = {
  id: string;
  title: string;
  images: string[];
  price: number;
  rating: number;
  distance: string;
  location: string;
  amenities: string[];
};

const MOCK_PROPERTIES: FullProperyProps[] = [
  {
    id: "1",
    title: "Modern Apartment with Kitchen",
    location: "Luján, Buenos Aires",
    price: 2500,
    images: [
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.1,
    distance: "30km",
    amenities: ["pool", "wifi"]
  },
  {
    id: "2",
    title: "Luxury Villa with Pool",
    location: "Luján, Buenos Aires",
    price: 6000,
    images: [
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house5.jpg"
    ],
    rating: 4.8,
    distance: "6km",
    amenities: ["wifi", "pet friendly"]
  },
  {
    id: "3",
    title: "Cozy Bedroom Suite",
    location: "Luján, Buenos Aires",
    price: 4500,
    images: [
      "/images/house3.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house.jpg"
    ],
    rating: 3.9,
    distance: "14km",
    amenities: ["pool", "wifi"]
  },
  {
    id: "4",
    title: "Elegant Studio Apartment",
    location: "Luján, Buenos Aires",
    price: 5600,
    images: [
      "/images/house4.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.5,
    distance: "8km",
    amenities: ["pool", "wifi", "garden"]
  },
  {
    id: "5",
    title: "Charming Kitchen Loft",
    location: "Luján, Buenos Aires",
    price: 2100,
    images: [
      "/images/house5.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.2,
    distance: "12km",
    amenities: ["parking space", "wifi"]
  },
  {
    id: "6",
    title: "Modern Architectural House",
    location: "Luján, Buenos Aires",
    price: 6500,
    images: [
      "/images/house.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.7,
    distance: "10km",
    amenities: ["wifi", "garden"]
  },
  {
    id: "7",
    title: "Cozy kitchen home with garden view",
    location: "Luján, Buenos Aires",
    price: 2500,
    images: [
      "/property1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.1,
    distance: "30km",
    amenities: ["pool", "parking space", "pet friendly"]
  },
  {
    id: "8",
    title: "Rustic Country Bungalow",
    location: "Luján, Buenos Aires",
    price: 3100,
    images: [
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house2.jpg",
      "/images/house.jpg"
    ],
    rating: 4.3,
    distance: "17km",
    amenities: ["wifi", "garden"]
  },
  {
    id: "9",
    title: "Minimalist Nature Retreat",
    location: "Luján, Buenos Aires",
    price: 3900,
    images: [
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/property1.jpg",
      "/images/house1.jpg"
    ],
    rating: 4.0,
    distance: "22km",
    amenities: ["pool", "wifi", "pet friendly"]
  },
  {
    id: "10",
    title: "Penthouse with Rooftop View",
    location: "Luján, Buenos Aires",
    price: 7000,
    images: [
      "/images/house5.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house2.jpg"
    ],
    rating: 4.9,
    distance: "5km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "11",
    title: "Downtown Artist’s Loft",
    location: "Luján, Buenos Aires",
    price: 3300,
    images: [
      "/images/house3.jpg",
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house5.jpg"
    ],
    rating: 3.8,
    distance: "13km",
    amenities: ["wifi"]
  },
  {
    id: "12",
    title: "Family Home with Backyard",
    location: "Luján, Buenos Aires",
    price: 4200,
    images: [
      "/images/house4.jpg",
      "/property1.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg"
    ],
    rating: 4.4,
    distance: "9km",
    amenities: ["garden", "pool", "wifi"]
  },
  {
    id: "13",
    title: "Smart Home with Modern Tech",
    location: "Luján, Buenos Aires",
    price: 4800,
    images: [
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.6,
    distance: "11km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "14",
    title: "Budget Studio Apartment",
    location: "Luján, Buenos Aires",
    price: 1900,
    images: [
      "/images/house5.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house3.jpg"
    ],
    rating: 3.5,
    distance: "18km",
    amenities: ["wifi"]
  },
  {
    id: "15",
    title: "Spacious Suburban Home",
    location: "Luján, Buenos Aires",
    price: 5300,
    images: [
      "/images/house2.jpg",
      "/images/house.jpg",
      "/property1.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.7,
    distance: "15km",
    amenities: ["garden", "wifi"]
  },
  {
    id: "16",
    title: "Nature Lover’s Cottage",
    location: "Luján, Buenos Aires",
    price: 2750,
    images: [
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house5.jpg",
      "/images/house1.jpg"
    ],
    rating: 4.1,
    distance: "28km",
    amenities: ["wifi", "pet friendly"]
  },
  {
    id: "17",
    title: "Peaceful Countryside Studio",
    location: "Luján, Buenos Aires",
    price: 2300,
    images: [
      "/images/house1.jpg",
      "/images/house5.jpg",
      "/images/house3.jpg",
      "/images/house2.jpg"
    ],
    rating: 3.9,
    distance: "19km",
    amenities: ["wifi"]
  },
  {
    id: "18",
    title: "Stylish Loft with Workspace",
    location: "Luján, Buenos Aires",
    price: 3700,
    images: [
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house.jpg"
    ],
    rating: 4.2,
    distance: "16km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "19",
    title: "Luxury Farm House",
    location: "Luján, Buenos Aires",
    price: 7200,
    images: [
      "/images/house.jpg",
      "/images/house5.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.9,
    distance: "4km",
    amenities: ["pool", "wifi", "garden"]
  },
  {
    id: "20",
    title: "Tranquil Studio by the Lake",
    location: "Luján, Buenos Aires",
    price: 3200,
    images: [
      "/images/house4.jpg",
      "/property1.jpg",
      "/images/house1.jpg",
      "/images/house5.jpg"
    ],
    rating: 4.3,
    distance: "21km",
    amenities: ["wifi", "pet friendly"]
  },
  {
    id: "21",
    title: "Eclectic Artist's Cabin",
    location: "Luján, Buenos Aires",
    price: 3100,
    images: [
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.0,
    distance: "25km",
    amenities: ["wifi", "garden"]
  },
  {
    id: "22",
    title: "Duplex with Shared Pool",
    location: "Luján, Buenos Aires",
    price: 4100,
    images: [
      "/images/house5.jpg",
      "/images/house2.jpg",
      "/images/house4.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.2,
    distance: "14km",
    amenities: ["pool", "wifi"]
  },
  {
    id: "23",
    title: "Studio Loft for Couples",
    location: "Luján, Buenos Aires",
    price: 2990,
    images: [
      "/images/house3.jpg",
      "/images/house2.jpg",
      "/images/house1.jpg",
      "/images/house5.jpg"
    ],
    rating: 3.7,
    distance: "19km",
    amenities: ["wifi"]
  },
  {
    id: "24",
    title: "Countryside Retreat with Hot Tub",
    location: "Luján, Buenos Aires",
    price: 5200,
    images: [
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house4.jpg",
      "/property1.jpg"
    ],
    rating: 4.6,
    distance: "7km",
    amenities: ["pool", "wifi", "parking space"]
  },
  {
    id: "25",
    title: "Elegant Home with Fireplace",
    location: "Luján, Buenos Aires",
    price: 5800,
    images: [
      "/images/house1.jpg",
      "/images/house5.jpg",
      "/images/house4.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.5,
    distance: "11km",
    amenities: ["wifi", "garden", "parking space"]
  }
];

export default function PropertyDetailPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const [property, setProperty] = useState<FullProperyProps | null>(null);

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
            key={index}
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
        onClick={() => window.history.back()}
        className="mt-4 text-sm underline text-blue-600"
      >
        ← Back to Search
      </button>
    </main>
  );
}
