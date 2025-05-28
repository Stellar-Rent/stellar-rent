'use client';
import * as Form from '@radix-ui/react-form';
import Image from 'next/image';
import type React from 'react';
import useListingForm from '~/hooks/use-listing-form';
import { createListing } from '~/services/propertyService';
import { helpTextClass, inputClass, labelClass, sectionClass } from './styles';
import type { Address, Coordinates, ListingFormValues } from './types';

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
          if (e.key === 'Enter' || e.key === ' ') {
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
          <span className="text-sm text-gray-500">Click or press Enter to select location</span>
        )}
      </div>
    </div>
  );
};

const AddressFields: React.FC<{
  value: Address;
  onChange: (address: Address) => void;
}> = ({ value, onChange }) => {
  const handleChange = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <Form.Field name="street">
        <Form.Label className={labelClass}>Street Address</Form.Label>
        <Form.Control asChild>
          <input
            type="text"
            className={inputClass}
            value={value.street}
            onChange={handleChange('street')}
          />
        </Form.Control>
      </Form.Field>

      <div className="grid grid-cols-2 gap-4">
        <Form.Field name="city">
          <Form.Label className={labelClass}>City</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.city}
              onChange={handleChange('city')}
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name="state">
          <Form.Label className={labelClass}>State</Form.Label>
          <Form.Control asChild>
            <input
              type="text"
              className={inputClass}
              value={value.state}
              onChange={handleChange('state')}
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
              onChange={handleChange('postalCode')}
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
              onChange={handleChange('country')}
            />
          </Form.Control>
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
    'WiFi',
    'Kitchen',
    'Washer',
    'Dryer',
    'Air Conditioning',
    'Heating',
    'TV',
    'Pool',
    'Gym',
    'Parking',
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
            if (e.key === 'Enter' || e.key === ' ') {
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
            key={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
            className="relative group"
          >
            <Image
              src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
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
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </section>
);

const ListingForm: React.FC = () => {
  const { register, handleSubmit, formState, setValue, watch } = useListingForm();
  const location = watch('location') || { lat: 0, lng: 0 };
  const address = watch('address') || {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };
  const amenities = watch('amenities') || [];
  const photos = watch('photos') || [];

  const onSubmit = async (data: ListingFormValues) => {
    console.log(data);
    await createListing(data);
  };

  return (
    <Form.Root onSubmit={handleSubmit(onSubmit)}>
      <Form.Field name="title">
        <Form.Label className={labelClass}>Title</Form.Label>
        <Form.Control asChild>
          <input
            id="title"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register('title')}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.title && (
          <Form.Message className={helpTextClass}>{formState.errors.title.message}</Form.Message>
        )}
      </Form.Field>

      <Form.Field name="description">
        <Form.Label className={labelClass}>Description</Form.Label>
        <Form.Control asChild>
          <textarea
            id="description"
            className={`${inputClass} focus:ring-2 focus:ring-primary focus:outline-none`}
            {...register('description')}
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
            {...register('price', { valueAsNumber: true })}
            aria-required="true"
          />
        </Form.Control>
        {formState.errors.price && (
          <Form.Message className={helpTextClass}>{formState.errors.price.message}</Form.Message>
        )}
      </Form.Field>

      <ListingSection title="Location">
        <LocationPicker value={location} onChange={(coords) => setValue('location', coords)} />
        <AddressFields value={address} onChange={(addr) => setValue('address', addr)} />
      </ListingSection>

      <ListingSection title="Amenities">
        <AmenitiesSelector value={amenities} onChange={(items) => setValue('amenities', items)} />
      </ListingSection>

      <ListingSection title="Photos">
        <PhotoUploader value={photos} onChange={(items) => setValue('photos', items)} />
      </ListingSection>

      <Form.Submit asChild>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition focus:ring-2 focus:ring-primary focus:outline-none"
          disabled={formState.isSubmitting}
          aria-busy={formState.isSubmitting}
        >
          {formState.isSubmitting ? 'Submitting...' : 'List Property'}
        </button>
      </Form.Submit>
    </Form.Root>
  );
};

export default ListingForm;
