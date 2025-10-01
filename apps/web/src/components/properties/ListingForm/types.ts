export type Address = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PropertySpecs = {
  bedrooms: number;
  bathrooms: number;
  guests: number;
  propertyType: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type ListingFormValues = {
  title: string;
  description: string;
  price: number;
  coordinates: Coordinates;
  address: Address;
  amenities: string[];
  images: (File | string)[];
  propertySpecs: {
    bedrooms: number;
    bathrooms: number;
    guests: number;
    propertyType: string;
  };
  availability: AvailabilityRange[];
  rules?: string;
  status: "available" | "maintenance" | "booked"
};

export type AvailabilityRange = {
  start_date: string;
  end_date: string;
  is_available: boolean;
};
