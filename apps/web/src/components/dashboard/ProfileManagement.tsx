'use client';

import {
  AlertCircle,
  Bell,
  Camera,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  location?: string;
  bio?: string;
  memberSince: string;
  totalBookings: number;
  totalSpent: number;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    pushNotifications: boolean;
  };
}

interface ProfileManagementProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({
  user,
  onUpdateProfile,
  onUploadAvatar,
  onDeleteAccount,
  isLoading = false,
  error = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [_showPreferences, setShowPreferences] = useState(false);
  const [_showSecurity, setShowSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    location: user.location || '',
    bio: user.bio || '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState(user.preferences);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: keyof UserProfile['preferences'], value: boolean) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await onUpdateProfile({ preferences });
      setShowPreferences(false);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // TODO: Implement password change API call
      console.log('Changing password:', passwordData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowSecurity(false);
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const handleAvatarUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Clear any previous errors
      setUploadError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (JPEG, PNG, GIF, etc.)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      let objectUrl: string | null = null;

      try {
        setUploadProgress(0);
        setShowAvatarUpload(true);

        // Create object URL for preview
        objectUrl = URL.createObjectURL(file);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        await onUploadAvatar(file);

        clearInterval(interval);
        setUploadProgress(100);

        setTimeout(() => {
          setShowAvatarUpload(false);
          setUploadProgress(0);
          setUploadError(null); // Clear error on success
        }, 1000);
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        setShowAvatarUpload(false);
        setUploadProgress(0);
        setUploadError('Failed to upload avatar. Please try again.');
      } finally {
        // Clean up object URL to prevent memory leaks
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    },
    [onUploadAvatar]
  );

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold dark:text-white text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 dark:text-white mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-white hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Error Message */}
              {uploadError && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold dark:text-white text-gray-900">{user.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">
                  Member since {user.memberSince}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{user.totalBookings}</div>
                <div className="text-sm dark:text-gray-400 text-gray-600">Total Bookings</div>
              </div>
            </div>

            {/* Avatar Upload Modal */}
            {showAvatarUpload && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-md w-full p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">
                      Uploading Avatar
                    </h3>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {uploadProgress}% complete
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="full-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                >
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, State, Country"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="bio-textarea"
                  className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio-textarea"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 font-medium"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        location: user.location || '',
                        bio: user.bio || '',
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-6">
              Notification Preferences
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium dark:text-white text-gray-900">
                      In-app Notifications
                    </h4>
                    <p className="text-sm dark:text-gray-400 text-gray-600">
                      Receive notifications within the app
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium dark:text-white text-gray-900">Email Updates</h4>
                    <p className="text-sm dark:text-gray-400 text-gray-600">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailUpdates}
                    onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium dark:text-white text-gray-900">
                      Push Notifications
                    </h4>
                    <p className="text-sm dark:text-gray-400 text-gray-600">
                      Receive push notifications on your device
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-6">
              Security Settings
            </h3>

            <div className="space-y-6">
              {/* Change Password */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="font-medium dark:text-white text-gray-900 mb-4">Change Password</h4>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium dark:text-white text-gray-700 mb-2"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium dark:text-white text-gray-900">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              </div>

              {/* Account Deletion */}
              <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        onDeleteAccount &&
                        confirm(
                          'Are you sure you want to delete your account? This action cannot be undone.'
                        )
                      ) {
                        await onDeleteAccount();
                      }
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;
