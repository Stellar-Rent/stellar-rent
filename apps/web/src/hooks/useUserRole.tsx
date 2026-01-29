'use client';

import { useEffect, useState } from 'react';
<<<<<<< HEAD
// @ts-ignore: Alias resolution issue
=======
>>>>>>> origin/main
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
      // 1. Si no está autenticado o no hay usuario, retornamos guest de inmediato
      if (!isAuthenticated || !user) {
        setRoleInfo({
          role: 'guest',
          canAccessHostDashboard: false,
          hasProperties: false,
        });
        setIsLoading(false);
        return;
      }

      // 2. Extraemos el ID. Si no existe, no llamamos a la API
      const userId = user.publicKey || user.id;
      if (!userId) {
        // CORRECCIÓN: Tipamos 'prev' como RoleInfo para eliminar el error 7006
        setRoleInfo((prev: RoleInfo) => ({ ...prev, role: 'guest' }));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        try {
<<<<<<< HEAD
          const response = await profileAPI.getUserProfile(userId);
          // biome-ignore lint/suspicious/noExplicitAny: API data handling
          const profile = (response.data as any) || {};
=======
          const userId = user.publicKey || 'unknown';
          const response = await profileAPI.getUserProfile(userId);
          const profile = response.data;
>>>>>>> origin/main

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
          // Fallback to localStorage if API fails
          const storedHostStatus = localStorage.getItem('hostStatus');
          const storedHasProperties = localStorage.getItem('hasProperties') === 'true';

          const validHostStatuses = ['pending', 'verified', 'rejected', 'suspended'];
          const hostStatus =
            storedHostStatus && validHostStatuses.includes(storedHostStatus)
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
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
