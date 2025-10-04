'use client';

import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { profileAPI } from '~/services/api';
import type { RoleInfo, UserRole } from '~/types/roles';
import { useAuth } from './auth/use-auth';

interface UseUserRoleReturn extends RoleInfo {
  isLoading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
=======
import type { RoleInfo, UserRole } from '~/types/roles';
import { useAuth } from './auth/use-auth';

export function useUserRole(): RoleInfo {
>>>>>>> 60310ea (feat: add stellar contract dependencies and integration setup)
  const { user, isAuthenticated } = useAuth();
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({
    role: 'guest',
    canAccessHostDashboard: false,
    hasProperties: false,
  });
<<<<<<< HEAD
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user) {
        setRoleInfo({
          role: 'guest',
          canAccessHostDashboard: false,
          hasProperties: false,
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Try to fetch profile from API first
        try {
          const response = await profileAPI.getUserProfile(user.id);
          const profile = response.data;

          // Extract host information from profile
          const hostStatus = profile.hostStatus;
          const hasProperties = profile.hasProperties || false;

          let role: UserRole = 'guest';
          let canAccessHostDashboard = false;

          // User is a host if they have verified host status and properties
          if (hostStatus === 'verified' && hasProperties) {
            role = 'dual'; // Can be both guest and host
            canAccessHostDashboard = true;
          } else if (hostStatus === 'verified') {
            // Verified but no properties yet
            role = 'host';
            canAccessHostDashboard = false; // No dashboard access without properties
          }

          setRoleInfo({
            role,
            hostStatus,
            canAccessHostDashboard,
            hasProperties,
          });

          // Cache in localStorage for faster subsequent loads
          if (hostStatus) {
            localStorage.setItem('hostStatus', hostStatus);
          }
          localStorage.setItem('hasProperties', String(hasProperties));
        } catch (apiError) {
          console.warn(
            'Failed to fetch user profile from API, falling back to localStorage',
            apiError
          );

          // Fallback to localStorage if API fails
          const storedHostStatus = localStorage.getItem('hostStatus');
          const storedHasProperties = localStorage.getItem('hasProperties') === 'true';

          // Validate hostStatus
          const validHostStatuses = ['pending', 'verified', 'rejected', 'suspended'];
          const hostStatus =
            storedHostStatus && validHostStatuses.includes(storedHostStatus)
              ? (storedHostStatus as 'pending' | 'verified' | 'rejected' | 'suspended')
              : undefined;

          let role: UserRole = 'guest';
          let canAccessHostDashboard = false;

          // User is a host if they have verified host status and properties
          if (hostStatus === 'verified' && storedHasProperties) {
            role = 'dual';
            canAccessHostDashboard = true;
          } else if (hostStatus === 'verified') {
            role = 'host';
            canAccessHostDashboard = false;
          }

          setRoleInfo({
            role,
            hostStatus,
            canAccessHostDashboard,
            hasProperties: storedHasProperties,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, isAuthenticated]);

  return { ...roleInfo, isLoading };
=======

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRoleInfo({
        role: 'guest',
        canAccessHostDashboard: false,
        hasProperties: false,
      });
      return;
    }

    // Check if user has host status in localStorage or from API
    const storedHostStatus = localStorage.getItem('hostStatus');
    const storedHasProperties = localStorage.getItem('hasProperties') === 'true';

    let role: UserRole = 'guest';
    let canAccessHostDashboard = false;

    // User is a host if they have verified host status and properties
    if (storedHostStatus === 'verified' && storedHasProperties) {
      role = 'dual'; // Can be both guest and host
      canAccessHostDashboard = true;
    } else if (storedHostStatus === 'verified') {
      // Verified but no properties yet
      role = 'host';
      canAccessHostDashboard = false; // No dashboard access without properties
    }

    setRoleInfo({
      role,
      hostStatus: storedHostStatus as 'pending' | 'verified' | 'rejected' | 'suspended' | undefined,
      canAccessHostDashboard,
      hasProperties: storedHasProperties,
    });
  }, [user, isAuthenticated]);

  return roleInfo;
>>>>>>> 60310ea (feat: add stellar contract dependencies and integration setup)
}
