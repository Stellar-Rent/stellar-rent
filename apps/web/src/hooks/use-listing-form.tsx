"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { listingSchema } from "~/components/properties/ListingForm/validation";
type ListingFormValues = z.infer<typeof listingSchema>;

export default function useListingForm() {
  const { register, handleSubmit, reset, formState, setValue, watch } =
    useForm<ListingFormValues>({
      resolver: zodResolver(listingSchema),
      defaultValues: {
        title: "",
        price: 0,
        description: "",
        coordinates: { lat: 0, lng: 0 },
        address: {
          address: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        amenities: [],
        images: [],
        rules: "",
        propertySpecs: {
          bedrooms: 0,
          bathrooms: 0,
          guests: 0,
          propertyType: "",
        },
        status: "available",
        availability: [
          {
            start_date: "",
            end_date: "",
            is_available: false,
          },
        ],
      },
      mode: "onChange",
    });

  return {
    register,
    handleSubmit,
    formState,
    reset,
    setValue,
    watch,
  };
}
