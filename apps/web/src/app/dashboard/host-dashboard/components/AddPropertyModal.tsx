'use client';
import { X } from 'lucide-react';
import type React from 'react';

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  newProperty: {
    title: string;
    description: string;
    location: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    guests: number;
    amenities: string[];
    propertyType: string;
    images: string[];
    rules: string;
  };
  setNewProperty: (
    updater: (prev: AddPropertyModalProps['newProperty']) => AddPropertyModalProps['newProperty']
  ) => void;
  onAmenityToggle: (amenity: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  open,
  onClose,
  newProperty,
  setNewProperty,
  onAmenityToggle,
  onSubmit,
}) => {
  if (!open) return null;

  const amenitiesList = [
    'WiFi',
    'Kitchen',
    'Parking',
    'Pool',
    'Gym',
    'Air Conditioning',
    'Heating',
    'TV',
    'Washer',
    'Dryer',
    'Balcony',
    'Garden',
    'Hot Tub',
    'Fireplace',
    'Dishwasher',
    'Microwave',
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'villa', label: 'Villa' },
    { value: 'cabin', label: 'Cabin' },
    { value: 'loft', label: 'Loft' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white text-gray-900">Add New Property</h2>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6 ">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label
                    htmlFor="property-title"
                    className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                  >
                    Property Title *
                  </label>
                  <input
                    id="property-title"
                    type="text"
                    required
                    value={newProperty.title}
                    onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                    className="w-full px-3 py-2 border dark:text-white text-black border-gray-300 rounded-lg  bg-transparent "
                    placeholder="Enter a catchy title for your property"
                  />
                </div>

                <div>
                  <label
                    htmlFor="property"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Property Type *
                  </label>
                  <select
                    id="property"
                    required
                    value={newProperty.propertyType}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, propertyType: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    value={newProperty.location}
                    onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                    className="w-full px-3 py-2 border dark:text-white   text-black border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, State, Country"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Price per Night ($) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    required
                    min="1"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    value={newProperty.description}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, description: e.target.value })
                    }
                    className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your property, its unique features, and what makes it special..."
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Property Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="bedrooms"
                    className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                  >
                    Bedrooms
                  </label>
                  <select
                    id="bedrooms"
                    value={newProperty.bedrooms}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        bedrooms: Number.parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} Bedroom{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bathroom"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Bathrooms
                  </label>
                  <select
                    id="bathroom"
                    value={newProperty.bathrooms}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        bathrooms: Number.parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} Bathroom{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="guest"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-2"
                  >
                    Max Guests
                  </label>
                  <select
                    id="guest"
                    value={newProperty.guests}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        guests: Number.parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((num) => (
                      <option key={num} value={num}>
                        {num} Guest{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Amenities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProperty.amenities.includes(amenity)}
                      onChange={() => onAmenityToggle(amenity)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm dark:text-white text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                House Rules
              </h3>
              <textarea
                rows={3}
                id="rules"
                value={newProperty.rules}
                onChange={(e) => setNewProperty({ ...newProperty, rules: e.target.value })}
                className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                placeholder="No smoking, No pets, Quiet hours after 10 PM, etc."
              />
            </div>

            <div className="pb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Photos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <title>Upload photos</title>
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block dark:text-white text-sm font-medium text-gray-900">
                        Upload property photos
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                      />
                    </label>
                    <p className="mt-1 text-xs dark:text-white text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 dark:text-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
