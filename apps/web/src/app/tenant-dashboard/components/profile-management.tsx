import React, { useState } from 'react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  verified: boolean;
  location?: string;
  bio?: string;
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

interface ProfileManagementProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSaveProfile = () => {
    onUpdateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl flex justify-center mx-auto flex-col">
      <div className="mb-8">
        <h2 className="text-3xl dark:text-white font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 dark:text-white mt-1">Manage your account information</p>
      </div>

      <div className="bg-white dark:bg-[#0B1D39]/90 dark:text-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <img 
              src={editedUser.avatar} 
              alt={editedUser.name}
              className="w-24 h-24 rounded-full mx-auto sm:mx-0"
            />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-bold dark:text-white text-gray-900">{editedUser.name}</h3>
              <p className="text-gray-600 dark:text-white">{editedUser.email}</p>
              <p className="text-sm dark:text-white text-gray-500 mt-1">Member since {editedUser.memberSince}</p>
              {editedUser.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  Verified
                </span>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            >
              {isEditing ? 'Cancel' : 'Edit Photo'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
            <div>
              <label htmlFor="name" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                id='name'
                type="text" 
                value={editedUser.name}
                disabled={!isEditing}
                onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 dark:text-white bg-transparent border border-gray-300 rounded-lg focus:ring-0 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="email" className="block dark:text-white text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                id='email'
                type="email" 
                value={editedUser.email}
                disabled={!isEditing}
                onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Phone</label>
              <input 
                id='phone'
                type="tel" 
                value={editedUser.phone}
                disabled={!isEditing}
                onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm dark:text-white font-medium text-gray-700 mb-2">Location</label>
              <input 
                id='location'
                type="text" 
                value={editedUser.location || ''}
                disabled={!isEditing}
                onChange={(e) => setEditedUser(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
                className="w-full px-3 py-2 dark:text-white border border-gray-300 rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="bio" className="block dark:text-white text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              id='bio' 
              rows={4}
              value={editedUser.bio || ''}
              disabled={!isEditing}
              onChange={(e) => setEditedUser(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell guests about yourself..."
              className="w-full px-3 py-2 dark:text-white border border-gray-300 text-black rounded-lg focus:ring-0 bg-transparent focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {isEditing && (
            <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button 
                type="button" 
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveProfile}
                className="bg-blue-600 dark:text-white text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
