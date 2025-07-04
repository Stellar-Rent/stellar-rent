export type FullPropertyProps = {
  id: string;
  title: string;
  images: string[];
  price: number;
  rating: number;
  maxGuests: number;
  bedrooms: number;
  distance: string;
  location: string;
  amenities: string[];
};

export const MOCK_PROPERTIES: FullPropertyProps[] = [
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
    maxGuests: 4,
    bedrooms: 2,
    distance: "30km",
    amenities: ["pool", "wifi"]
  },
  {
    id: "2",
    title: "Luxury Villa with Pool",
    location: "Mendoza, Argentina",
    price: 6000,
    images: [
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house5.jpg"
    ],
    rating: 4.8,
    maxGuests: 8,
    bedrooms: 4,
    distance: "6km",
    amenities: ["wifi", "pet friendly"]
  },
  {
    id: "3",
    title: "Cozy Bedroom Suite",
    location: "Rosario, Santa Fe",
    price: 4500,
    images: [
      "/images/house3.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house.jpg"
    ],
    rating: 3.9,
    maxGuests: 7,
    bedrooms: 4,
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
    maxGuests: 10,
    bedrooms: 6,
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
    maxGuests: 14,
    bedrooms: 6,
    distance: "12km",
    amenities: ["parking space", "wifi"]
  },
  {
    id: "6",
    title: "Modern Architectural House",
    location: "Córdoba, Argentina",
    price: 6500,
    images: [
      "/images/house.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.7,
    maxGuests: 2,
    bedrooms: 1,
    distance: "10km",
    amenities: ["wifi", "garden"]
  },
  {
    id: "7",
    title: "Cozy kitchen home with garden view",
    location: "San Isidro, Buenos Aires",
    price: 2500,
    images: [
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.1,
    maxGuests: 6,
    bedrooms: 2,
    distance: "30km",
    amenities: ["pool", "parking space", "pet friendly"]
  },
  {
    id: "8",
    title: "Rustic Country Bungalow",
    location: "Palermo, Buenos Aires",
    price: 3100,
    images: [
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house2.jpg",
      "/images/house.jpg"
    ],
    rating: 4.3,
    maxGuests: 10,
    bedrooms: 5,
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
      "/images/property-1.jpg",
      "/images/house1.jpg"
    ],
    rating: 4.0,
    maxGuests: 12,
    bedrooms: 7,
    distance: "22km",
    amenities: ["pool", "wifi", "pet friendly"]
  },
  {
    id: "10",
    title: "Penthouse with Rooftop View",
    location: "Rosario, Santa Fe",
    price: 7000,
    images: [
      "/images/house5.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house2.jpg"
    ],
    rating: 4.9,
    maxGuests: 6,
    bedrooms: 4,
    distance: "5km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "11",
    title: "Downtown Artist’s Loft",
    location: "Mendoza, Argentina",
    price: 3300,
    images: [
      "/images/house3.jpg",
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house5.jpg"
    ],
    rating: 3.8,
    maxGuests: 13,
    bedrooms: 8,
    distance: "13km",
    amenities: ["wifi"]
  },
  {
    id: "12",
    title: "Family Home with Backyard",
    location: "Rosario, Santa Fe",
    price: 4200,
    images: [
      "/images/house4.jpg",
      "/images/property-1.jpg",
      "/images/house1.jpg",
      "/images/house2.jpg"
    ],
    rating: 4.4,
    maxGuests: 4,
    bedrooms: 3,
    distance: "9km",
    amenities: ["garden", "pool", "wifi"]
  },
  {
    id: "13",
    title: "Smart Home with Modern Tech",
    location: "Córdoba, Argentina",
    price: 4800,
    images: [
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.6,
    maxGuests: 3,
    bedrooms: 3,
    distance: "11km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "14",
    title: "Budget Studio Apartment",
    location: "San Isidro, Buenos Aires",
    price: 1900,
    images: [
      "/images/house5.jpg",
      "/images/house1.jpg",
      "/images/house4.jpg",
      "/images/house3.jpg"
    ],
    rating: 3.5,
    maxGuests: 2,
    bedrooms: 2,
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
      "/images/property-1.jpg",
      "/images/house4.jpg"
    ],
    rating: 4.7,
    maxGuests: 3,
    bedrooms: 1,
    distance: "15km",
    amenities: ["garden", "wifi"]
  },
  {
    id: "16",
    title: "Nature Lover’s Cottage",
    location: "Córdoba, Argentina",
    price: 2750,
    images: [
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house5.jpg",
      "/images/house1.jpg"
    ],
    rating: 4.1,
    maxGuests: 9,
    bedrooms: 3,
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
    maxGuests: 6,
    bedrooms: 2,
    distance: "19km",
    amenities: ["wifi"]
  },
  {
    id: "18",
    title: "Stylish Loft with Workspace",
    location: "San Isidro, Buenos Aires",
    price: 3700,
    images: [
      "/images/house2.jpg",
      "/images/house3.jpg",
      "/images/house4.jpg",
      "/images/house.jpg"
    ],
    rating: 4.2,
    maxGuests: 7,
    bedrooms: 4,
    distance: "16km",
    amenities: ["wifi", "parking space"]
  },
  {
    id: "19",
    title: "Luxury Farm House",
    location: "Mendoza, Argentina",
    price: 7200,
    images: [
      "/images/house.jpg",
      "/images/house5.jpg",
      "/images/house2.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.9,
    maxGuests: 1,
    bedrooms: 1,
    distance: "4km",
    amenities: ["pool", "wifi", "garden"]
  },
  {
    id: "20",
    title: "Tranquil Studio by the Lake",
    location: "Palermo, Buenos Aires",
    price: 3200,
    images: [
      "/images/house4.jpg",
      "/images/property-1.jpg",
      "/images/house1.jpg",
      "/images/house5.jpg"
    ],
    rating: 4.3,
    maxGuests: 2,
    bedrooms: 1,
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
    maxGuests: 2,
    bedrooms: 2,
    distance: "25km",
    amenities: ["wifi", "garden"]
  },
  {
    id: "22",
    title: "Duplex with Shared Pool",
    location: "Córdoba, Argentina",
    price: 4100,
    images: [
      "/images/house5.jpg",
      "/images/house2.jpg",
      "/images/house4.jpg",
      "/images/house3.jpg"
    ],
    rating: 4.2,
    maxGuests: 5,
    bedrooms: 5,
    distance: "14km",
    amenities: ["pool", "wifi"]
  },
  {
    id: "23",
    title: "Studio Loft for Couples",
    location: "Mendoza, Argentina",
    price: 2990,
    images: [
      "/images/house3.jpg",
      "/images/house2.jpg",
      "/images/house1.jpg",
      "/images/house5.jpg"
    ],
    rating: 3.7,
    maxGuests: 3,
    bedrooms: 2,
    distance: "19km",
    amenities: ["wifi"]
  },
  {
    id: "24",
    title: "Countryside Retreat with Hot Tub",
    location: "Rosario, Santa Fe",
    price: 5200,
    images: [
      "/images/house.jpg",
      "/images/house2.jpg",
      "/images/house4.jpg",
      "/images/property-1.jpg"
    ],
    rating: 4.6,
    maxGuests: 8,
    bedrooms: 2,
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
    maxGuests: 3,
    bedrooms: 2,
    distance: "11km",
    amenities: ["wifi", "garden", "parking space"]
  }
];
