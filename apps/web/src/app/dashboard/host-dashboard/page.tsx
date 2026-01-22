'use client';
import NetworkStatus from '@/components/NetworkStatus';
import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import ProfileManagement from '@/components/dashboard/ProfileManagement';
import PropertyManagement from '@/components/dashboard/PropertyManagement';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useRealTimeNotifications } from '@/hooks/useRealTimeUpdates';
import { Calendar, DollarSign, Settings, User, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { AddPropertyModal } from './components/AddPropertyModal';
import { AvailableBalance } from './components/AvailableBalance';
import { BookingStats } from './components/BookingStats';
import { CalendarModal } from './components/CalendarModal';
import { EarningsStats } from './components/EarningsStats';
import { PaymentMethods } from './components/PaymentMethods';
import { PayoutHistory } from './components/PayoutHistory';
import { RecentTransactions } from './components/RecentTransactions';
import { mockBookings, mockEarnings, mockProperties, mockUser } from './mockData';
import type { Property, UserProfile } from './types';

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState(mockProperties);
  const [selectedProperty, _setSelectedProperty] = useState<Property | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
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
    rules: '',
  });
  const [user, setUser] = useState(mockUser);
  const [bookings, setBookings] = useState(mockBookings);

  const {
    notifications,
    unreadCount: unreadNotifications,
    addNotification,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    deleteAllNotifications: handleDeleteAllNotifications,
  } = useRealTimeNotifications(user.id);

  const handleAddProperty = (e: React.FormEvent) => {
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
        image:
          newProperty.images[0] ||
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        status: 'active' as const,
        bookings: 0,
        earnings: 0,
        description: newProperty.description,
        amenities: newProperty.amenities,
        propertyType: newProperty.propertyType,
        rules: newProperty.rules,
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
        rules: '',
      });
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setNewProperty((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' as const, canCancel: false }
            : booking
        )
      );

      addNotification({
        id: Date.now().toString(),
        type: 'booking',
        title: 'Booking Cancelled',
        message: 'A booking has been cancelled',
        priority: 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUser((prev) => ({ ...prev, ...updatedProfile }));

      addNotification({
        id: Date.now().toString(),
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated',
        priority: 'low',
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const avatarUrl = URL.createObjectURL(file);
      setUser((prev) => ({ ...prev, avatar: avatarUrl }));

      addNotification({
        id: Date.now().toString(),
        type: 'system',
        title: 'Avatar Updated',
        message: 'Your profile picture has been successfully updated',
        priority: 'low',
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

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

  return (
    <RoleGuard requiredRole="host">
      <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
        {/* Header */}
        <header className="bg-white dark:bg-card/90 dark:text-foreground shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <NetworkStatus isConnected={true} />
                <NotificationSystem
                  notifications={notifications.map((notification) => ({
                    id: notification.id,
                    type: notification.type === 'property' ? 'booking' : notification.type,
                    title: notification.title,
                    message: notification.message,
                    timestamp: new Date(notification.createdAt),
                    read: notification.isRead,
                    priority: notification.priority,
                  }))}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDeleteNotification={handleDeleteNotification}
                  onDeleteAllNotifications={handleDeleteAllNotifications}
                  unreadCount={unreadNotifications}
                />
                <button type="button" className="text-gray-500 dark:text-white">
                  <Settings className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-3">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-white">
                    {user.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'properties', label: 'My Properties', icon: User },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'earnings', label: 'Earnings', icon: DollarSign },
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    type="button"
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'properties' && (
            <PropertyManagement
              properties={properties}
              isLoading={false}
              onAddProperty={(property) => {
                const newPropertyWithId = {
                  ...property,
                  id: Date.now(),
                  rating: 0,
                  reviews: 0,
                  bookings: 0,
                  earnings: 0,
                };
                setProperties([...properties, newPropertyWithId]);
              }}
              onUpdateProperty={(id, updates) => {
                setProperties(properties.map((p) => (p.id === id ? { ...p, ...updates } : p)));
              }}
              onDeleteProperty={(id) => {
                setProperties(properties.filter((p) => p.id !== id));
              }}
              onToggleStatus={(id, status) => {
                setProperties(properties.map((p) => (p.id === id ? { ...p, status } : p)));
              }}
            />
          )}

          {activeTab === 'bookings' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                  Property Bookings
                </h2>
                <p className="text-gray-600 dark:text-white mt-1">
                  Manage bookings for your properties
                </p>
              </div>

              {/* Statistics Cards */}
              <BookingStats bookings={bookings} />

              <BookingHistory
                bookings={bookings}
                onCancelBooking={handleCancelBooking}
                isLoading={false}
              />
            </div>
          )}

          {activeTab === 'earnings' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                  Earnings Overview
                </h2>
                <p className="text-gray-600 mt-1 dark:text-white">Track your income and payouts</p>
              </div>

              {/* Earnings Stats */}
              <EarningsStats
                totalEarnings={mockEarnings.totalEarnings}
                monthlyEarnings={mockEarnings.monthlyEarnings}
                pendingPayouts={mockEarnings.pendingPayouts}
              />

              {/* Recent Transactions */}
              <RecentTransactions transactions={mockEarnings.transactions} />
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileManagement
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onUploadAvatar={handleUploadAvatar}
              isLoading={false}
            />
          )}

          {activeTab === 'wallet' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                  Wallet & Payments
                </h2>
                <p className="text-gray-600 dark:text-white mt-1">
                  Manage your payment methods and payouts
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Balance */}
                <AvailableBalance balance={mockEarnings.pendingPayouts} />

                {/* Payment Methods */}
                <PaymentMethods />
              </div>

              {/* Payout History */}
              <PayoutHistory />
            </div>
          )}
        </div>

        {/* Calendar Modal */}
        <CalendarModal
          open={showCalendarModal}
          selectedProperty={selectedProperty}
          selectedDates={selectedDates}
          onToggleDate={toggleDateSelection}
          onClearAll={() => setSelectedDates(new Set())}
          onClose={() => setShowCalendarModal(false)}
          onSave={() => setShowCalendarModal(false)}
        />

        {/* Add Property Modal */}
        <AddPropertyModal
          open={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          newProperty={newProperty}
          setNewProperty={(updated) => setNewProperty(updated)}
          onAmenityToggle={handleAmenityToggle}
          onSubmit={handleAddProperty}
        />
      </div>
    </RoleGuard>
  );
};

export default HostDashboard;
