'use client';
import NetworkStatus from '@/components/NetworkStatus';
import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import ProfileManagement from '@/components/dashboard/ProfileManagement';
import PropertyManagement from '@/components/dashboard/PropertyManagement';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useRealTimeNotifications } from '@/hooks/useRealTimeUpdates';
import { Calendar, ChevronRight, DollarSign, Home, Settings, User, Wallet } from 'lucide-react';
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

// Componente Breadcrumb local para evitar errores de importación
const Breadcrumb = ({ className }: { className?: string }) => (
  <nav className={`flex text-gray-500 text-sm ${className}`} aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-3">
      <li className="inline-flex items-center">
        <Home className="w-4 h-4 mr-2" />
        Dashboard
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="ml-1 md:ml-2 font-medium text-gray-700 dark:text-gray-300">Host</span>
        </div>
      </li>
    </ol>
  </nav>
);

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState(mockProperties);
  const [_selectedProperty] = useState<Property | null>(null);
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
    const priceValue = Number.parseInt(newProperty.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const property: Property = {
        id: Date.now(),
        title: newProperty.title,
        location: newProperty.location,
        price: priceValue,
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
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const, canCancel: false } : b
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
  };

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedProfile }));
  };

  const handleUploadAvatar = async (file: File) => {
    const avatarUrl = URL.createObjectURL(file);
    setUser((prev) => ({ ...prev, avatar: avatarUrl }));
  };

  const toggleDateSelection = (date: Date): void => {
    const dateStr = date.toISOString().split('T')[0];
    const newSelectedDates = new Set(selectedDates);
    if (newSelectedDates.has(dateStr)) newSelectedDates.delete(dateStr);
    else newSelectedDates.add(dateStr);
    setSelectedDates(newSelectedDates);
  };

  return (
    <RoleGuard requiredRole="host">
      <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
        <header className="bg-white dark:bg-card/90 dark:text-foreground shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="pt-4" />
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Dashboard</h1>
              <div className="flex items-center space-x-4">
                <NetworkStatus isConnected={true} />
                <NotificationSystem
                  notifications={notifications.map((n) => ({
                    ...n,
                    timestamp: new Date(n.createdAt),
                    read: n.isRead,
                    type: n.type === 'property' ? 'booking' : (n.type as any),
                  }))}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDeleteNotification={handleDeleteNotification}
                  onDeleteAllNotifications={handleDeleteAllNotifications}
                  unreadCount={unreadNotifications}
                />
                <Settings className="w-6 h-6 text-gray-500 cursor-pointer" />
                <div className="flex items-center space-x-3">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium dark:text-white">{user.name}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'properties', label: 'My Properties', icon: Home },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'wallet', label: 'Wallet', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'properties' && (
            <PropertyManagement
              properties={properties}
              isLoading={false}
              onAddProperty={(p) =>
                setProperties([
                  ...properties,
                  { ...p, id: Date.now(), rating: 0, reviews: 0, bookings: 0, earnings: 0 },
                ])
              }
              onUpdateProperty={(id, upds) =>
                setProperties(properties.map((p) => (p.id === id ? { ...p, ...upds } : p)))
              }
              onDeleteProperty={(id) => setProperties(properties.filter((p) => p.id !== id))}
              onToggleStatus={(id, status) =>
                setProperties(properties.map((p) => (p.id === id ? { ...p, status } : p)))
              }
            />
          )}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <BookingStats bookings={bookings} />
              <BookingHistory
                bookings={bookings}
                onCancelBooking={handleCancelBooking}
                isLoading={false}
              />
            </div>
          )}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <EarningsStats {...mockEarnings} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AvailableBalance balance={mockEarnings.pendingPayouts} />
              <PaymentMethods />
              <div className="lg:col-span-2">
                <PayoutHistory />
              </div>
            </div>
          )}
        </main>

        <CalendarModal
          open={showCalendarModal}
          selectedProperty={null}
          selectedDates={selectedDates}
          onToggleDate={toggleDateSelection}
          onClearAll={() => setSelectedDates(new Set())}
          onClose={() => setShowCalendarModal(false)}
          onSave={() => setShowCalendarModal(false)}
        />
        <AddPropertyModal
          open={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          newProperty={newProperty}
          setNewProperty={setNewProperty}
          onAmenityToggle={handleAmenityToggle}
          onSubmit={handleAddProperty}
        />
      </div>
    </RoleGuard>
  );
};

export default HostDashboard;
