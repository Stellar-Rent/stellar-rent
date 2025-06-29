/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  User, 
  Wallet, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  TrendingUp,
  MapPin,
  Bed,
  Bath,
  Users,
  Star,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Settings,
  Bell,
  Search,
  X,
  Check
} from 'lucide-react';

interface Property {
    id: number;
    title: string;
    location: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    guests: number;
    rating: number;
    reviews: number;
    image: string;
    status: 'active' | 'inactive';
    bookings: number;
    earnings: number;
    description?: string;
    amenities?: string[];
    propertyType?: string;
    rules?: string;
}

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: 1,
    title: "Luxury Downtown Apartment",
    location: "New York, NY",
    price: 250,
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    status: "active" as const,
    bookings: 15,
    earnings: 3750
  },
  {
    id: 2,
    title: "Cozy Beach House",
    location: "Miami, FL",
    price: 180,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    status: "active",
    bookings: 12,
    earnings: 2160
  },
  {
    id: 3,
    title: "Mountain Cabin Retreat",
    location: "Aspen, CO",
    price: 320,
    bedrooms: 4,
    bathrooms: 3,
    guests: 8,
    rating: 4.7,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
    status: "inactive",
    bookings: 8,
    earnings: 2560
  }
];

const mockEarnings = {
  totalEarnings: 8470,
  monthlyEarnings: 2340,
  pendingPayouts: 1250,
  transactions: [
    { id: 1, date: "2025-05-28", property: "Luxury Downtown Apartment", amount: 250, status: "completed" },
    { id: 2, date: "2025-05-26", property: "Cozy Beach House", amount: 180, status: "completed" },
    { id: 3, date: "2025-05-24", property: "Mountain Cabin Retreat", amount: 320, status: "pending" },
    { id: 4, date: "2025-05-22", property: "Luxury Downtown Apartment", amount: 250, status: "completed" },
    { id: 5, date: "2025-05-20", property: "Cozy Beach House", amount: 180, status: "completed" }
  ]
};

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    guests: 1,
    amenities: [] as string[],
    propertyType: 'apartment',
    images: [] as string[],
    rules: ''
  });
  const [user] = useState({
    name: "John Smith",
    email: "john.smith@example.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    hostSince: "2022",
    properties: 3,
    totalEarnings: 8470
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesFilter;
  });


const handleDeleteProperty = (propertyId: number): void => {
    setProperties(properties.filter((p: Property) => p.id !== propertyId));
};



const handleTogglePropertyStatus = (propertyId: number): void => {
    setProperties(properties.map((p: Property) => 
        p.id === propertyId 
            ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
            : p
    ));
};

  const handleAddProperty = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const price = Number.parseInt(newProperty.price);
   if (Number.isNaN(price) || price <= 0) {
   alert('Please enter a valid price');
   return;
 }
 
 try {
    const property: Property = {
      id: Date.now(),
      title: newProperty.title,
      location: newProperty.location,
      price,
      bedrooms: newProperty.bedrooms,
      bathrooms: newProperty.bathrooms,
      guests: newProperty.guests,
      rating: 0,
      reviews: 0,
      image: newProperty.images[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
      status: "active" as const,
      bookings: 0,
      earnings: 0,
      description: newProperty.description,
      amenities: newProperty.amenities,
      propertyType: newProperty.propertyType,
      rules: newProperty.rules
    };
    
    setProperties([...properties, property]);
    setShowAddPropertyModal(false);
     setNewProperty({
     title: '',
    description: '',
     location: '',
     price: '',
     bedrooms: 1,
     bathrooms: 1,
     guests: 1,
     amenities: [],
     propertyType: 'apartment',
     images: [],
     rules: ''
   });
    } catch (error) {
    console.error('Error adding property:', error);
   alert('Failed to add property. Please try again.');
 };
   
  };

  const handleAmenityToggle = (amenity: string) => {
    setNewProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const generateCalendar = () => {
    const today = new Date();
    const days = [];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

interface DateSelection {
    newSelectedDates: Set<string>;
}

const toggleDateSelection = (date: Date): void => {
    const dateStr: string = date.toISOString().split('T')[0];
    const newSelectedDates: Set<string> = new Set(selectedDates);
    if (newSelectedDates.has(dateStr)) {
        newSelectedDates.delete(dateStr);
    } else {
        newSelectedDates.add(dateStr);
    }
    setSelectedDates(newSelectedDates);
};

  const PropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            property.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {property.status}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-1">{property.title}</h3>
            <p className="text-gray-600 dark:text-white flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold  text-blue-600">${property.price}</p>
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
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
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
        
        <div className="flex space-x-2">
          <button type="button"
            onClick={() => {
              setSelectedProperty(property);
              setShowCalendarModal(true);
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </button>
          <button  type="button"
            onClick={() => {
              setSelectedProperty(property);
              setShowPropertyModal(true);
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button type="button"
            onClick={() => handleTogglePropertyStatus(property.id)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button type="button"
            onClick={() => handleDeleteProperty(property.id)}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const CalendarModal = () => {
    if (!showCalendarModal || !selectedProperty) return null;
    
    const calendarDays = generateCalendar();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const today = new Date();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Calendar - {selectedProperty.title}
              </h2>
              <button  type="button"
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {monthNames[today.getMonth()]} {today.getFullYear()}
              </h3>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDates.has(dateStr);
                  const isCurrentMonth = date.getMonth() === today.getMonth();
                  const isPast = date < today;
                  
                  return (
                    <button type="button"
                      key={date.toISOString()}
                      onClick={() => !isPast && toggleDateSelection(date)}
                      disabled={isPast}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        isPast 
                          ? 'text-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : isCurrentMonth
                          ? 'text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedDates.size} dates blocked
              </div>
              <div className="space-x-3">
                <button type="button"
                  onClick={() => setSelectedDates(new Set())}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
                <button type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddPropertyModal = () => {
    if (!showAddPropertyModal) return null;

    const amenitiesList = [
      'WiFi', 'Kitchen', 'Parking', 'Pool', 'Gym', 'Air Conditioning',
      'Heating', 'TV', 'Washer', 'Dryer', 'Balcony', 'Garden',
      'Hot Tub', 'Fireplace', 'Dishwasher', 'Microwave'
    ];

    const propertyTypes = [
      { value: 'apartment', label: 'Apartment' },
      { value: 'house', label: 'House' },
      { value: 'condo', label: 'Condo' },
      { value: 'villa', label: 'Villa' },
      { value: 'cabin', label: 'Cabin' },
      { value: 'loft', label: 'Loft' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white text-gray-900">Add New Property</h2>
              <button type="button"
                onClick={() => setShowAddPropertyModal(false)}
                className="text-gray-500 dark:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-6 ">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label  htmlFor="propert-tittle" className="block text-sm font-medium dark:text-white text-gray-700 mb-2">Property Title *</label>
                    <input
                        id='property-title'
                      type="text"
                      required
                      value={newProperty.title}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border dark:text-white text-black border-gray-300 rounded-lg  bg-transparent "
                      placeholder="Enter a catchy title for your property"
                    />
                  </div>
                  
                  <div>
                    <label  htmlFor="property" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Property Type *</label>
                    <select
                        id='property'
                      required
                      value={newProperty.propertyType}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, propertyType: e.target.value }))}
                      className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    >
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label  htmlFor="location" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Location *</label>
                    <input
                        id='location'
                      type="text"
                      required
                      value={newProperty.location}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border dark:text-white   text-black border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State, Country"
                    />
                  </div>

                  <div>
                    <label  htmlFor="price" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Price per Night ($) *</label>
                    <input
                        id='price'
                      type="number"
                      required
                      min="1"
                      value={newProperty.price}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label  htmlFor="description" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                        id='description'
                      required
                      rows={4}
                      value={newProperty.description}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your property, its unique features, and what makes it special..."
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor='bedroom' className="block text-sm font-medium dark:text-white text-gray-700 mb-2">Bedrooms</label>
                    <select
                        id='bedrooms'
                      value={newProperty.bedrooms}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} Bedroom{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label  htmlFor="bathroom" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Bathrooms</label>
                    <select
                        id='bathroom'
                      value={newProperty.bathrooms}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, bathrooms: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                        <option key={num} value={num}>{num} Bathroom{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="guest" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Max Guests</label>
                    <select
                        id='guest'
                      value={newProperty.guests}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {amenitiesList.map(amenity => (
                    <label  key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProperty.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm dark:text-white text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">House Rules</h3>
                <textarea
                  rows={3}
                id='rules'
                  value={newProperty.rules}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, rules: e.target.value }))}
                  className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  placeholder="No smoking, No pets, Quiet hours after 10 PM, etc."
                />
              </div>

              {/* Photos */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Photos</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-label="Upload photos">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block dark:text-white text-sm font-medium text-gray-900">
                          Upload property photos
                        </span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" />
                      </label>
                      <p className="mt-1 text-xs dark:text-white text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
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

  return (
    <div className="min-h-screen bg-gray-50 pt-[5%]  bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-[#0B1D39]/90 dark:text-white  shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button type="button" className="text-gray-500  dark:text-white">
                <Bell className="w-6 h-6" />
              </button>
              <button type="button" className="text-gray-500 dark:text-white">
                <Settings className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-white">{user.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'properties', label: 'My Properties', icon: Home },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'wallet', label: 'Wallet', icon: Wallet }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-white  hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'properties' && (
          <div>
            {/* Properties Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Properties</h2>
                <p className="text-gray-600 dark:text-white mt-1">Manage your listings and bookings</p>
              </div>
              <button type="button" className="bg-blue-600 text-white  px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                onClick={() => setShowAddPropertyModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Property
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 dark:text-white">
              <div className="relative flex-1 text-black">
                <Search className="w-5 h-5 absolute left-3 dark:text-white  top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                id='search'
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border dark:text-white border-gray-300 bg-transparent rounded-lg  "
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:text-white dark:bg-transparent rounded-lg bg-transparent text-black focus:ring-0 border focus:ring-blue-500 focus:border-black"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No properties found</h3>
                <p className="text-gray-600 dark:text-white">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold dark:text-white text-gray-900">Earnings Overview</h2>
              <p className="text-gray-600 mt-1 dark:text-white">Track your income and payouts</p>
            </div>

            {/* Earnings Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-[#0B1D39]/90 dark:text-white shadow p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium  dark:text-white text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold dark:text-white text-gray-900">${mockEarnings.totalEarnings}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600  font-medium">+12%</span>
                  <span className="text-gray-600 dark:text-white ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white text-gray-600">This Month</p>
                    <p className="text-3xl font-bold dark:text-white text-gray-900">${mockEarnings.monthlyEarnings}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-blue-600 font-medium">+8%</span>
                  <span className="text-gray-600 dark:text-white ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white text-gray-600">Pending Payouts</p>
                    <p className="text-3xl font-bold dark:text-white text-gray-900">${mockEarnings.pendingPayouts}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Wallet className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-600 dark:text-white">Next payout in 3 days</span>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900">Recent Transactions</h3>
                  <button type='button' className="text-blue-600 hover:text-blue-700 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50  dark:bg-[#0B1D39]/90 dark:text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white divide-y divide-gray-200">
                    {mockEarnings.transactions.map(transaction => (
                      <tr key={transaction.id} className="">
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">
                          {transaction.property}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">
                          ${transaction.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl flex justify-center mx-auto flex-col">
            <div className="mb-8">
              <h2 className="text-3xl dark:text-white font-bold text-gray-900">Profile Settings</h2>
              <p className="text-gray-600 dark:text-white mt-1">Manage your account information</p>
            </div>

            <div className="bg-white dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-6 mb-8">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full"
                  />
                  <div>
                    <h3 className="text-2xl font-bold dark:text-white text-gray-900">{user.name}</h3>
                    <p className="text-gray-600 dark:text-white">{user.email}</p>
                    <p className="text-sm dark:text-white text-gray-500 mt-1">Host since {user.hostSince}</p>
                  </div>
                  <button type="button" className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Edit Photo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                  <div>
                    <label htmlFor="name" className="block text-sm  dark:text-white font-medium text-gray-700 mb-2">Full Name</label>
                    <input 
                        id='name'
                      type="text" 
                      defaultValue={user.name}
                      className="w-full px-3 py-2 dark:text-white bg-transparent border border-gray-300 rounded-lg focus:ring-0 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block dark:text-white text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                        id='email'
                      type="email" 
                      defaultValue={user.email}
                      className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Phone</label>
                    <input 
                        id='phone'
                      type="tel" 
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Location</label>
                    <input 
                    id='location'
                      type="text" 
                      placeholder="City, State"
                      className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="bio" className="block dark:text-white text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    id='bio' 
                    rows={4}
                    placeholder="Tell guests about yourself..."
                    className="w-full px-3 py-2 dark:text-white border border-gray-300 text-black rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" className="bg-blue-600 dark:text-white text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold dark:text-white text-gray-900">Wallet & Payments</h2>
              <p className="text-gray-600 dark:text-white mt-1">Manage your payment methods and payouts</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Balance */}
              <div className="bg-white dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-4">Available Balance</h3>
                <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                  <p className="text-4xl font-bold">${mockEarnings.pendingPayouts}</p>
                  <p className="text-blue-100 mt-2">Available for withdrawal</p>
                </div>
                <button type="button" className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Request Payout
                </button>
              </div>

              {/* Payment Methods */}
              <div className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900">Payment Methods</h3>
                  <button type="button" className="text-blue-600 dark:text-white hover:text-blue-700 text-sm font-medium">
                    + Add New
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VISA</span>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white text-gray-900">•••• •••• •••• 4532</p>
                        <p className="text-sm dark:text-white text-gray-500">Expires 12/26</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Primary</span>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">BANK</span>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white text-gray-900">Chase Bank ••••9876</p>
                        <p className="text-sm dark:text-white text-gray-500">Checking Account</p>
                      </div>
                    </div>
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout History */}
            <div className="mt-8 bg-white  dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold dark:text-white text-gray-900">Payout History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50  dark:bg-[#0B1D39]/90 dark:text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white  dark:bg-[#0B1D39]/90 dark:text-white divide-y divide-gray-200">
                    <tr className="">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">May 25, 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">$1,850</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">Chase Bank ••••9876</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs  font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr className="">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">May 11, 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">$2,340</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">•••• •••• •••• 4532</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2  py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr className="">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">Apr 28, 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">$1,920</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">Chase Bank ••••9876</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1  text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      <CalendarModal />
      
      {/* Add Property Modal */}
      <AddPropertyModal />
    </div>
  );
};

export default HostDashboard;