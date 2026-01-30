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

          <form onSubmit={onSubmit} className="space-y-6">
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
                    onChange={(e) => setNewProperty((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border dark:text-white text-black border-gray-300 rounded-lg bg-transparent"
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
                      setNewProperty((prev) => ({ ...prev, propertyType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent"
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
                    onChange={(e) =>
                      setNewProperty((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full px-3 py-2 border dark:text-white text-black border-gray-300 rounded-lg bg-transparent"
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
                    onChange={(e) => setNewProperty((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg bg-transparent"
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
                      setNewProperty((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg bg-transparent"
                    placeholder="Describe your property..."
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
                      setNewProperty((prev) => ({
                        ...prev,
                        bedrooms: Number.parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg bg-transparent"
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
                      setNewProperty((prev) => ({
                        ...prev,
                        bathrooms: Number.parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg bg-transparent"
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
                      setNewProperty((prev) => ({
                        ...prev,
                        guests: Number.parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg bg-transparent"
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
                      className="rounded border-gray-300 text-blue-600"
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
                onChange={(e) => setNewProperty((prev) => ({ ...prev, rules: e.target.value }))}
                className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg bg-transparent"
                placeholder="No smoking, No pets, etc."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 dark:text-white border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                Add Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
