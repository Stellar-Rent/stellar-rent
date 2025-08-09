import type { Property, PropertyReview } from '../types/property';

// Mock properties data
export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Apartment with Kitchen',
    location: 'Luján, Buenos Aires',
    address: 'Av. San Martín 1234, Luján, Buenos Aires, Argentina',
    price: 2500,
    images: [
      '/images/house1.webp',
      '/images/house2.webp',
      '/images/house3.webp',
      '/images/house4.webp',
      '/images/house5.webp',
    ],
    rating: 4.1,
    reviewCount: 24,
    distance: '30km from city center',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      'Wi-Fi',
      'Air conditioning',
      'Fully equipped kitchen',
      'Washer & dryer',
      'Free parking',
      'Smart TV',
    ],
    description:
      'Experience luxury and comfort in this beautifully designed modern apartment. Located in the heart of Luján, this property offers stunning views and easy access to local attractions. The space features contemporary furnishings, high-end appliances, and thoughtful amenities to ensure your stay is memorable. Perfect for couples, families, or business travelers seeking a premium accommodation experience.',
    policies: {
      cancellation: 'Free cancellation up to 48 hours before check-in',
      checkIn: '3:00 PM - 9:00 PM',
      checkOut: '11:00 AM',
      deposit: 500,
    },
    coordinates: {
      lat: -34.5708,
      lng: -59.1056,
    },
    availability: {
      unavailableDates: [
        new Date('2024-02-15'),
        new Date('2024-02-16'),
        new Date('2024-02-20'),
        new Date('2024-03-01'),
        new Date('2024-03-02'),
        new Date('2024-03-03'),
      ],
      minNights: 2,
    },
    neighborhoodInfo: {
      walkability: 'Very Walkable',
      transitScore: 'Excellent',
      bikeScore: 'Bikeable',
      restaurants: '5 min walk',
      grocery: '3 min walk',
      publicTransit: '2 min walk',
    },
  },
  {
    id: '2',
    title: 'Luxury Villa with Pool',
    location: 'Luján, Buenos Aires',
    address: 'Calle Rivadavia 567, Luján, Buenos Aires, Argentina',
    price: 6000,
    images: ['/images/house2.webp', '/images/house1.webp', '/images/house3.webp'],
    rating: 4.8,
    reviewCount: 89,
    distance: '6km from city center',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: [
      'Wi-Fi',
      'Pool',
      'Air conditioning',
      'Fully equipped kitchen',
      'Free parking',
      'Garden',
      'BBQ area',
    ],
    description:
      'Stunning luxury villa with private pool and beautiful garden. Perfect for large groups and families looking for a premium vacation experience.',
    policies: {
      cancellation: 'Free cancellation up to 7 days before check-in',
      checkIn: '4:00 PM - 8:00 PM',
      checkOut: '10:00 AM',
      deposit: 1000,
    },
    coordinates: {
      lat: -34.565,
      lng: -59.11,
    },
    availability: {
      unavailableDates: [new Date('2024-03-10'), new Date('2024-03-11'), new Date('2024-03-12')],
      minNights: 3,
    },
    neighborhoodInfo: {
      walkability: 'Somewhat Walkable',
      transitScore: 'Good',
      bikeScore: 'Very Bikeable',
      restaurants: '10 min walk',
      grocery: '8 min walk',
      publicTransit: '5 min walk',
    },
  },
  {
    id: '3',
    title: 'Cozy Bedroom Suite',
    location: 'Luján, Buenos Aires',
    address: 'Av. Constitución 890, Luján, Buenos Aires, Argentina',
    price: 4500,
    images: ['/images/house3.webp', '/images/house4.webp'],
    rating: 3.9,
    reviewCount: 45,
    distance: '14km from city center',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['Wi-Fi', 'Air conditioning', 'Kitchenette', 'TV'],
    description:
      'Comfortable and cozy bedroom suite perfect for couples. Clean, modern, and well-located.',
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in',
      checkIn: '2:00 PM - 10:00 PM',
      checkOut: '11:00 AM',
      deposit: 300,
    },
    coordinates: {
      lat: -34.58,
      lng: -59.095,
    },
    availability: {
      unavailableDates: [new Date('2024-02-25'), new Date('2024-02-26')],
      minNights: 1,
    },
    neighborhoodInfo: {
      walkability: "Walker's Paradise",
      transitScore: 'Excellent',
      bikeScore: 'Bikeable',
      restaurants: '2 min walk',
      grocery: '1 min walk',
      publicTransit: '3 min walk',
    },
  },
  {
    id: '4',
    title: 'Elegant Studio Apartment',
    location: 'Luján, Buenos Aires',
    address: 'Calle Belgrano 123, Luján, Buenos Aires, Argentina',
    price: 5600,
    images: ['/images/house4.webp', '/images/house5.webp', '/images/house1.webp'],
    rating: 4.5,
    reviewCount: 67,
    distance: '8km from city center',
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['Wi-Fi', 'Air conditioning', 'Kitchen', 'Washer', 'TV', 'Balcony'],
    description:
      'Elegant studio apartment with modern amenities and a beautiful balcony overlooking the city.',
    policies: {
      cancellation: 'Free cancellation up to 48 hours before check-in',
      checkIn: '3:00 PM - 9:00 PM',
      checkOut: '11:00 AM',
      deposit: 400,
    },
    coordinates: {
      lat: -34.572,
      lng: -59.102,
    },
    availability: {
      unavailableDates: [
        new Date('2024-03-05'),
        new Date('2024-03-06'),
        new Date('2024-03-07'),
        new Date('2024-03-08'),
      ],
      minNights: 2,
    },
    neighborhoodInfo: {
      walkability: 'Very Walkable',
      transitScore: 'Good',
      bikeScore: 'Bikeable',
      restaurants: '7 min walk',
      grocery: '4 min walk',
      publicTransit: '6 min walk',
    },
  },
  {
    id: '5',
    title: 'Charming Kitchen Loft',
    location: 'Luján, Buenos Aires',
    address: 'Av. Mitre 456, Luján, Buenos Aires, Argentina',
    price: 2100,
    images: ['/images/house5.webp', '/images/house2.webp'],
    rating: 4.2,
    reviewCount: 33,
    distance: '12km from city center',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['Wi-Fi', 'Fully equipped kitchen', 'Heating', 'TV', 'Free parking'],
    description:
      'Charming loft with a fully equipped kitchen and rustic charm. Great for longer stays.',
    policies: {
      cancellation: 'Free cancellation up to 72 hours before check-in',
      checkIn: '1:00 PM - 8:00 PM',
      checkOut: '12:00 PM',
      deposit: 250,
    },
    coordinates: {
      lat: -34.568,
      lng: -59.115,
    },
    availability: {
      unavailableDates: [new Date('2024-02-28'), new Date('2024-03-01')],
      minNights: 2,
    },
    neighborhoodInfo: {
      walkability: 'Somewhat Walkable',
      transitScore: 'Fair',
      bikeScore: 'Bikeable',
      restaurants: '12 min walk',
      grocery: '6 min walk',
      publicTransit: '8 min walk',
    },
  },
  {
    id: '6',
    title: 'Modern Architectural House',
    location: 'Luján, Buenos Aires',
    address: 'Calle Sarmiento 789, Luján, Buenos Aires, Argentina',
    price: 6500,
    images: ['/images/house.webp', '/images/house1.webp', '/images/house3.webp'],
    rating: 4.7,
    reviewCount: 78,
    distance: '10km from city center',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: [
      'Wi-Fi',
      'Air conditioning',
      'Fully equipped kitchen',
      'Washer & dryer',
      'Free parking',
      'Garden',
      'Smart TV',
      'Fireplace',
    ],
    description:
      'Stunning modern architectural house with unique design and premium amenities. Perfect for design enthusiasts.',
    policies: {
      cancellation: 'Free cancellation up to 5 days before check-in',
      checkIn: '4:00 PM - 7:00 PM',
      checkOut: '10:00 AM',
      deposit: 800,
    },
    coordinates: {
      lat: -34.575,
      lng: -59.108,
    },
    availability: {
      unavailableDates: [
        new Date('2024-03-15'),
        new Date('2024-03-16'),
        new Date('2024-03-17'),
        new Date('2024-03-18'),
        new Date('2024-03-19'),
      ],
      minNights: 3,
    },
    neighborhoodInfo: {
      walkability: 'Very Walkable',
      transitScore: 'Excellent',
      bikeScore: 'Very Bikeable',
      restaurants: '4 min walk',
      grocery: '3 min walk',
      publicTransit: '2 min walk',
    },
  },
];

// Mock reviews data
export const MOCK_REVIEWS: Record<string, PropertyReview[]> = {
  '1': [
    {
      id: '1',
      author: 'Sarah M.',
      rating: 5,
      date: '2024-01-15',
      comment:
        'Amazing property with stunning views! The host was very responsive and the place was exactly as described.',
      verified: true,
      helpful: 12,
    },
    {
      id: '2',
      author: 'Mike R.',
      rating: 4,
      date: '2024-01-10',
      comment: 'Great location and clean space. Would definitely stay again.',
      verified: true,
      helpful: 8,
    },
    {
      id: '3',
      author: 'Emma L.',
      rating: 5,
      date: '2024-01-05',
      comment:
        'Perfect for our family vacation. The amenities were top-notch and the neighborhood was very safe.',
      verified: true,
      helpful: 15,
    },
  ],
  '2': [
    {
      id: '4',
      author: 'John D.',
      rating: 5,
      date: '2024-01-20',
      comment: 'Incredible villa with an amazing pool! Perfect for our group vacation.',
      verified: true,
      helpful: 20,
    },
    {
      id: '5',
      author: 'Lisa K.',
      rating: 4,
      date: '2024-01-18',
      comment: 'Beautiful property, though a bit far from the center. Worth it for the luxury!',
      verified: true,
      helpful: 6,
    },
  ],
  // Add more reviews for other properties as needed
};

// Utility functions
export const getPropertyById = (id: string): Property | undefined => {
  return MOCK_PROPERTIES.find((property) => property.id === id);
};

export const getReviewsByPropertyId = (propertyId: string): PropertyReview[] => {
  return MOCK_REVIEWS[propertyId] || [];
};

export const getFeaturedProperties = (limit?: number): Property[] => {
  return limit ? MOCK_PROPERTIES.slice(0, limit) : MOCK_PROPERTIES;
};

export const getAvailabilityStatus = (propertyId: string): 'available' | 'limited' | 'booked' => {
  const statuses = ['available', 'limited', 'booked'] as const;
  // Use property ID to generate consistent status
  const hash = propertyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return statuses[hash % statuses.length];
};
