'use client';

import { useEffect, useState } from 'react';
// @ts-ignore: Alias resolution issue
import { profileAPI } from '~/services/api';
// @ts-ignore: Alias resolution issue
import type { RoleInfo, UserRole } from '~/types/roles';
import { useAuth } from './auth/use-auth';

interface UseUserRoleReturn extends RoleInfo {
  isLoading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, isAuthenticated } = useAuth();
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({
    role: 'guest',
    canAccessHostDashboard: false,
    hasProperties: false,
  });
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

        try {
          const userId = user.publicKey || 'unknown';
          const response = await profileAPI.getUserProfile(userId);
          const profile = (response as any).data || {};

          const hostStatus = profile.hostStatus;
          const hasProperties = profile.hasProperties || false;

          let role: UserRole = 'guest';
          let canAccessHostDashboard = false;

          if (hostStatus === 'verified' && hasProperties) {
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
            hasProperties,
          });

          if (hostStatus) {
            localStorage.setItem('hostStatus', hostStatus);
          }
          localStorage.setItem('hasProperties', String(hasProperties));
        } catch (_apiError) {
          // Fallback to local storage if API call fails
          const storedHostStatus = localStorage.getItem('hostStatus');
          const storedHasProperties = localStorage.getItem('hasProperties') === 'true';

          const validStatuses = ['pending', 'verified', 'rejected', 'suspended'];
          const hostStatus =
            storedHostStatus && validStatuses.includes(storedHostStatus)
              ? (storedHostStatus as 'pending' | 'verified' | 'rejected' | 'suspended')
              : undefined;

          let role: UserRole = 'guest';
          let canAccessHostDashboard = false;

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
}
