'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth/use-auth';

// NOTE: The `profileAPI` is not yet implemented.
// import { profileAPI } from '~/services/api';

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState<'guest' | 'host' | 'dual' | null>(null);
  const [hostStatus, setHostStatus] = useState<'verified' | 'unverified' | 'pending' | null>(null);
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
          };

          setRole(mockProfile.role);
          setHostStatus(mockProfile.hostStatus);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setRole('guest'); // Default to 'guest' on error
          setHostStatus('unverified');
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthenticated) {
        setRole(null);
        setHostStatus(null);
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [isAuthenticated, user]);

  const canAccessHostDashboard = (role === 'host' || role === 'dual') && hostStatus === 'verified';

  return { role, canAccessHostDashboard, isLoading };
}