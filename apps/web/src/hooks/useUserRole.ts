// apps/web/src/hooks/useUserRole.ts
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth/use-auth';

// NOTE: The `profileAPI` is not yet implemented.
// import { profileAPI } from '~/services/api';

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
          // In a real application, you would fetch the user's profile from an API
          // const userProfile = await profileAPI.getProfile();

          // For demonstration purposes, we'll use a mock profile.
          // To test different roles, you can change the mock data here.
          const mockProfile = {
            // Try changing this to 'guest' or 'host' to see the redirection.
            role: 'dual' as const,
            hostStatus: 'verified' as const,
            properties: [{ id: 1, name: 'My Property' }], // Mock properties
          };

          setRole(mockProfile.role);
          setHostStatus(mockProfile.hostStatus);
          setProperties(mockProfile.properties);
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
