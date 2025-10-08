// apps/web/src/hooks/useUserRole.ts
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth/use-auth';

// NOTE: The `profileAPI` is not yet implemented, so we're using a mock.
// import { profileAPI } from '~/services/api';

// Mock user profiles for development, keyed by user ID
const mockUserProfiles = {
  'user-1': {
    role: 'host' as const,
    hostStatus: 'verified' as const,
    properties: [{ id: 1, name: 'Host Property' }],
  },
  'user-2': {
    role: 'guest' as const,
    hostStatus: 'unverified' as const,
    properties: [],
  },
  'user-3': {
    role: 'dual' as const,
    hostStatus: 'verified' as const,
    properties: [{ id: 2, name: 'Dual User Property' }],
  },
};

// Mock implementation of profileAPI for development
const profileAPI = {
  getProfile: async (userId: string) => {
    // In a real app, this would be a network request.
    // For development, we simulate a delay and return a mock profile.
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      const profile = mockUserProfiles[userId];
      if (profile) {
        return profile;
      }
    }

    // Default profile for production or if user not in mock data
    return {
      role: 'guest' as const,
      hostStatus: 'unverified' as const,
      properties: [],
    };
  },
};

interface Property {
  id: number;
  name: string;
}

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState<'guest' | 'host' | 'dual' | null>(null);
  const [hostStatus, setHostStatus] = useState<'verified' | 'unverified' | 'pending' | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (isAuthenticated && user) {
        setIsLoading(true);
        try {
          // The user object from useAuth needs to have an `id` property.
          // For now, we'll assume it does. If not, this will need adjustment.
          // @ts-ignore
          const userProfile = await profileAPI.getProfile(user.id || 'user-2'); // Default to user-2 for demo

          setRole(userProfile.role);
          setHostStatus(userProfile.hostStatus);
          setProperties(userProfile.properties);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setRole('guest'); // Default to 'guest' on error
          setHostStatus('unverified');
          setProperties([]);
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthenticated) {
        setRole(null);
        setHostStatus(null);
        setProperties([]);
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [isAuthenticated, user]);

  const hasProperties = properties.length > 0;
  const canAccessHostDashboard =
    (role === 'host' || role === 'dual') && hostStatus === 'verified' && hasProperties;

  return { role, canAccessHostDashboard, isLoading, hasProperties };
}
