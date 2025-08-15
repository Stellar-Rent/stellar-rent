'use client';
import { BlockchainVerification } from '@/components/blockchain/BlockchainVerification';
import { Bath, Bed, Calendar, Edit3, Eye, MapPin, Star, Trash2, Users } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onShowCalendar: (p: Property) => void;
  onShowEdit: (p: Property) => void;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onShowCalendar,
  onShowEdit,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <div className="relative w-full h-48">
          <Image src={property.image} alt={property.title} fill className="object-cover" />
        </div>
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              property.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {property.status}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-1">
              {property.title}
            </h3>
            <p className="text-gray-600 dark:text-white flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">${property.price}</p>
            <p className="text-sm text-gray-500 dark:text-white">per night</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm dark:text-white text-gray-600">
            <span className="flex items-center dark:text-white">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms} bed
            </span>
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms} bath
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {property.guests} guests
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-[#1cf0a8]" />
            <span className="ml-1 text-sm font-medium">{property.rating}</span>
            <span className="ml-1 text-sm text-gray-500 dark:text-white">({property.reviews})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-transparent rounded-lg">
          <div className="text-center">
            <p className="text-lg font-bold dark:text-white text-gray-900">{property.bookings}</p>
            <p className="text-sm dark:text-white text-gray-600">Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">${property.earnings}</p>
            <p className="text-sm dark:text-white text-gray-600">Earned</p>
          </div>
        </div>

        <div className="mb-4">
          <BlockchainVerification propertyId={property.id.toString()} className="text-xs" />
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => onShowCalendar(property)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </button>
          <button
            type="button"
            onClick={() => onShowEdit(property)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(property.id)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(property.id)}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
