"use client";
import * as Form from "@radix-ui/react-form";
import Image from "next/image";
import type React from "react";
import useListingForm from "~/hooks/use-listing-form";
import { helpTextClass, inputClass, labelClass, sectionClass } from "./styles";
import type {
  Address,
  Coordinates,
  ListingFormValues,
  PropertySpecs,
} from "./types";
import { propertyAPI } from "~/services/api";
import type { PropertyFormData } from "~/types";
import { supabase } from "~/lib/supabaseClient";
import { useAuth } from "~/hooks/auth/use-auth";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const LocationPicker: React.FC<{
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
}> = ({ value, onChange }) => {
  const handleMapClick = () => {
    onChange({ lat: 37.7749, lng: -122.4194 });
  };

  return (
    <div className="mb-4">
      <div
        aria-label="Select location on map"
        className="h-48 bg-gray-100 rounded-lg cursor-pointer flex items-center justify-center focus:ring-2 focus:ring-primary focus:outline-none"
        onClick={handleMapClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleMapClick();
          }
        }}
      >
        {value.lat && value.lng ? (
          <span className="text-sm text-gray-600">
            Selected: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            Click or press Enter to select location
          </span>
        )}
      </div>
    </div>
  );
};

const AddressFields: React.FC<{
  value: Address;
  onChange: (address: Address) => void;
  formState: any;
}> = ({ value, onChange, formState }) => {
  const handleChange =
    (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: e.target.value });
    };

  return (
    <div className="space-y-4">
      <Form.Field name="address">
        <Form.Label className={labelClass}>Street Address</Form.Label>
        <Form.Control asChild>
          <input
            type="text"
            className={inputClass}
            value={value.address}
            onChange={handleChange("address")}
          />
        </Form.Control>
        {formState.errors.address?.address && (
          <Form.Message className={helpTextClass}>
            {formState.errors.address?.address.message}
          </Form.Message>
        )}
      </Form.Field>

      <div className="grid grid-cols-2 gap-4">
        <Form.Field name="city">
          <Form.Label className={labelClass}>City</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.city}
              onChange={handleChange("city")}
            />
          </Form.Control>
          {formState.errors.address?.city && (
            <Form.Message className={helpTextClass}>
              {formState.errors.address?.city.message}
            </Form.Message>
          )}
        </Form.Field>

        <Form.Field name="state">
          <Form.Label className={labelClass}>State</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.state}
              onChange={handleChange("state")}
            />
          </Form.Control>
        </Form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Field name="postalCode">
          <Form.Label className={labelClass}>Postal Code</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.postalCode}
              onChange={handleChange("postalCode")}
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name="country">
          <Form.Label className={labelClass}>Country</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.country}
              onChange={handleChange("country")}
            />
          </Form.Control>
          {formState.errors.address?.country && (
            <Form.Message className={helpTextClass}>
              {formState.errors.address?.country.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>
    </div>
  );
};

const PropertySpecsFields: React.FC<{
  value: PropertySpecs;
  onChange: (address: PropertySpecs) => void;
  formState: any;
}> = ({ value, onChange, formState }) => {
  const handleChange =
    (field: keyof PropertySpecs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const fieldValue =
        field === "propertyType" ? inputValue : Number(inputValue) || 0;
      onChange({ ...value, [field]: fieldValue });
    };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Form.Field name="propertyType">
          <Form.Label className={labelClass}>Property Type</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.propertyType}
              onChange={handleChange("propertyType")}
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name="guests">
          <Form.Label className={labelClass}>Number of Guests</Form.Label>
          <Form.Control asChild>
            <input
              type="number"
              className={inputClass}
              value={value.guests}
              onChange={handleChange("guests")}
            />
          </Form.Control>
          {formState.errors.propertySpecs?.guests && (
            <Form.Message className={helpTextClass}>
              {formState.errors.propertySpecs.guests.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Field name="bedrooms">
          <Form.Label className={labelClass}>Number of Bedrooms</Form.Label>
          <Form.Control asChild>
            <input
              type="number"
              className={inputClass}
              value={value.bedrooms}
              onChange={handleChange("bedrooms")}
            />
          </Form.Control>
          {formState.errors.propertySpecs?.bedrooms && (
            <Form.Message className={helpTextClass}>
              {formState.errors.propertySpecs?.bedrooms.message}
            </Form.Message>
          )}
        </Form.Field>

        <Form.Field name="bathrooms">
          <Form.Label className={labelClass}>Number of Bathrooms</Form.Label>
          <Form.Control asChild>
            <input
              type="number"
              className={inputClass}
              value={value.bathrooms}
              onChange={handleChange("bathrooms")}
            />
          </Form.Control>
          {formState.errors.propertySpecs?.bathrooms && (
            <Form.Message className={helpTextClass}>
              {formState.errors.propertySpecs?.bathrooms.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>
    </div>
  );
};

const AmenitiesSelector: React.FC<{
  value: string[];
  onChange: (amenities: string[]) => void;
}> = ({ value, onChange }) => {
  const commonAmenities = [
    "WiFi",
    "Kitchen",
    "Washer",
    "Dryer",
    "Air Conditioning",
    "Heating",
    "TV",
    "Pool",
    "Gym",
    "Parking",
  ];

  const toggleAmenity = (amenity: string) => {
    if (value.includes(amenity)) {
      onChange(value.filter((a) => a !== amenity));
    } else {
      onChange([...value, amenity]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4" aria-labelledby="amenities-group">
      <h3 id="amenities-group" className="sr-only">
        Available Amenities
      </h3>
      {commonAmenities.map((amenity) => (
        <label
          key={amenity}
          className="flex items-center space-x-2 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:outline-none p-2 rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleAmenity(amenity);
            }
          }}
        >
          <input
            type="checkbox"
            checked={value.includes(amenity)}
            onChange={() => toggleAmenity(amenity)}
            className="rounded text-primary focus:ring-primary"
            aria-label={`Select ${amenity} amenity`}
          />
          <span className="text-gray-700">{amenity}</span>
        </label>
      ))}
    </div>
  );
};

const PhotoUploader: React.FC<{
  value: (File | string)[];
  onChange: (photos: (File | string)[]) => void;
}> = ({ value, onChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange([...value, ...files]);
  };

  const removePhoto = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="space-y-4" aria-labelledby="photo-uploader">
      <h3 id="photo-uploader" className="sr-only">
        Photo Upload Section
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {value.map((photo, index) => (
          <div
            key={typeof photo === "string" ? photo : URL.createObjectURL(photo)}
            className="relative group"
          >
            <Image
              src={
                typeof photo === "string" ? photo : URL.createObjectURL(photo)
              }
              alt={`Property ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
              width={300}
              height={128}
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition focus:opacity-100 focus:ring-2 focus:ring-primary focus:outline-none"
              aria-label={`Remove photo ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <label className="block w-full text-sm text-gray-500">
        <span className="sr-only">Upload photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label="Upload property photos"
        />
      </label>
    </fieldset>
  );
};

const ListingSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className={sectionClass}>
    <h2 className="text-lg font-semibold mb-4 text-black">{title}</h2>
    {children}
  </section>
);

const ListingForm: React.FC = () => {
  const { register, handleSubmit, formState, setValue, watch } =
    useListingForm();
  const location = watch("coordinates") || { lat: 0, lng: 0 };
  const address = {
    address: watch("address")?.address ?? "",
    city: watch("address")?.city ?? "",
    state: watch("address")?.state ?? "",
    postalCode: watch("address")?.postalCode ?? "",
    country: watch("address")?.country ?? "",
  };
  const amenities = watch("amenities") || [];
  const images = watch("images") || [];
  const propertySpecs = watch("propertySpecs") || {
    bedrooms: 0,
    bathrooms: 0,
    guests: 0,
    propertyType: "",
  };

  const { user } = useAuth();
  if (!user) return;

  const onSubmit = async (data: ListingFormValues) => {
    if (!images.length) {
      toast.error("Please upload at least one image.");
      return;
    }

    try {
      const urls: string[] = [];

      for (const image of Array.from(images)) {
        const filePath = `${Date.now()}-${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from("list-properties")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("list-properties")
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          urls.push(publicData.publicUrl);
        } else {
          throw new Error("Failed to retrieve public URL for uploaded image.");
        }
      }

      const { postalCode, state, ...address } = data.address;

      const payload: PropertyFormData = {
        title: data.title,
        description: data.description,
        price: data.price,
        ...address,
        latitude: data.coordinates.lat,
        longitude: data.coordinates.lng,
        amenities: data.amenities,
        images: urls,
        bedrooms: data.propertySpecs.bedrooms,
        bathrooms: data.propertySpecs.bathrooms,
        max_guests: data.propertySpecs.guests,
        owner_id: user.id,
        status: data.status,
        availability: data.availability,
        security_deposit: 1000,
      };

      await propertyAPI.createProperty(payload);

      toast.success("Property successfully created");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  if (Object.keys(formState.errors).length > 0) {
    import("react-hot-toast").then(({ toast }) => {
      toast.error("Please fix the errors in the form before submitting.");
    });
  }

  return (
    <Form.Root onSubmit={handleSubmit(onSubmit)}>
      <Form.Field name="title">
        <Form.Label className={labelClass}>Title</Form.Label>
        <Form.Control asChild>
          <input
            id="title"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register("title")}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.title && (
          <Form.Message className={helpTextClass}>
            {formState.errors.title.message}
          </Form.Message>
        )}
      </Form.Field>

      <Form.Field name="description">
        <Form.Label className={labelClass}>Description</Form.Label>
        <Form.Control asChild>
          <textarea
            id="description"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register("description")}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.description && (
          <Form.Message className={helpTextClass}>
            {formState.errors.description.message}
          </Form.Message>
        )}
      </Form.Field>

      <Form.Field name="price">
        <Form.Label className={labelClass}>Price per Night</Form.Label>
        <Form.Control asChild>
          <input
            id="price"
            type="number"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register("price", { valueAsNumber: true })}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.price && (
          <Form.Message className={helpTextClass}>
            {formState.errors.price.message}
          </Form.Message>
        )}
      </Form.Field>

      <ListingSection title="Location">
        <LocationPicker
          value={location}
          onChange={(coords) => setValue("coordinates", coords)}
        />
        <AddressFields
          value={address}
          onChange={(addr) => setValue("address", addr)}
          formState={formState}
        />
      </ListingSection>

      <ListingSection title="Amenities">
        <AmenitiesSelector
          value={amenities}
          onChange={(items) => setValue("amenities", items)}
        />
      </ListingSection>

      <ListingSection title="Property Specs">
        <PropertySpecsFields
          value={propertySpecs}
          onChange={(items) => setValue("propertySpecs", items)}
          formState={formState}
        />
      </ListingSection>

      <ListingSection title="Photos">
        <PhotoUploader
          value={images}
          onChange={(items) => setValue("images", items)}
        />
      </ListingSection>

      <Form.Field name="rules">
        <Form.Label className={labelClass}>Rules</Form.Label>
        <Form.Control asChild>
          <textarea
            id="rules"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register("rules")}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.rules && (
          <Form.Message className={helpTextClass}>
            {formState.errors.rules.message}
          </Form.Message>
        )}
      </Form.Field>

      <Form.Field name="status">
        <Form.Label className={labelClass}>Status</Form.Label>
        <Form.Control asChild>
          <select
            className={inputClass}
            {...register("status")}
            aria-required="true"
          >
            <option value="">Select status</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="booked">Booked</option>
          </select>
        </Form.Control>
        {formState.errors.rules && (
          <Form.Message className={helpTextClass}>
            {formState.errors.rules.message}
          </Form.Message>
        )}
      </Form.Field>

      <ListingSection title="Availability">
        <div className="">
          {watch("availability")?.map((period: any, idx: number) => (
            <div key={period.from + period.to} className="grid grid-cols-3 items-center gap-2 mb-2">
              <div className="flex flex-col items-start gap-1">
                <span className="mx-1 text-black text-left">From</span>
                <input
                  type="date"
                  className={inputClass}
                  value={period.start_date}
                  onChange={(e) => {
                    const updated = [...(watch("availability") || [])];
                    updated[idx] = {
                      ...updated[idx],
                      start_date: e.target.value,
                    };
                    setValue("availability", updated);
                  }}
                  aria-label="Start date"
                />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="mx-1 text-black text-left">To</span>
                <input
                  type="date"
                  className={inputClass}
                  value={period.end_date}
                  onChange={(e) => {
                    const updated = [...(watch("availability") || [])];
                    updated[idx] = {
                      ...updated[idx],
                      end_date: e.target.value,
                    };
                    setValue("availability", updated);
                  }}
                  aria-label="End date"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 ml-2">
                  <input
                    type="checkbox"
                    checked={!!period.is_available}
                    onChange={(e) => {
                      const updated = [...(watch("availability") || [])];
                      updated[idx] = {
                        ...updated[idx],
                        is_available: e.target.checked,
                      };
                      setValue("availability", updated);
                    }}
                    aria-label="Is available"
                  />
                  <span className="text-sm text-black">Available</span>
                </label>
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:underline"
                  onClick={() => {
                    const updated = [...(watch("availability") || [])];
                    updated.splice(idx, 1);
                    setValue("availability", updated);
                  }}
                  aria-label="Remove period"
                >
                  <X color="red" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm text-black"
          onClick={() => {
            setValue("availability", [
              ...(watch("availability") || []),
              { start_date: "", end_date: "", is_available: true },
            ]);
          }}
        >
          Add Availability Period
        </button>
      </ListingSection>

      <Form.Submit asChild>
        <button
          type="submit"
          onClick={() => console.log("🔘 Button clicked")}
          className="w-full py-2 px-4 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition focus:ring-2 focus:ring-primary focus:outline-none"
          disabled={formState.isSubmitting}
          aria-busy={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Submitting..." : "List Property"}
        </button>
      </Form.Submit>
    </Form.Root>
  );
};

export default ListingForm;
