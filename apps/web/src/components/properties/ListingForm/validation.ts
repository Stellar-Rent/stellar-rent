import type { ImageUpscaleIcon } from "lucide-react";
import { z } from "zod";

export const listingSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  price: z
    .number()
    .min(1, "Price must be greater than 0")
    .max(10000, "Price cannot exceed 10000"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  address: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().min(1, "Country is required"),
  }),
  amenities: z.string().array(),
  images: z.any().array(),
  rules: z.string().optional(),
  propertySpecs: z.object({
    bedrooms: z.number().min(1, "At least 1 bedroom"),
    bathrooms: z.number().min(1, "At least 1 bathroom"),
    guests: z.number().min(1, "At least 1 guest").max(20, "Maximum 20 guests"),
    propertyType: z.string(),
  }),
  status: z.enum(["available", "booked", "maintenance"]),
  availability: z
    .object({
      start_date: z.string(),
      end_date: z.string(),
      is_available: z.boolean(),
    })
    .array(),
});
