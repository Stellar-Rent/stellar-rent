'use client';

import { useEffect, useState } from 'react';
import type { RoleInfo, UserRole } from '~/types/roles';
import { useAuth } from './auth/use-auth';

export function useUserRole(): RoleInfo {
  const { user, isAuthenticated } = useAuth();
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({
    role: 'guest',
    canAccessHostDashboard: false,
    hasProperties: false,
  });

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
      hasProperties: storedHasProperties,
    });
  }, [user, isAuthenticated]);

  return roleInfo;
}
