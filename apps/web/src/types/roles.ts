// Role types for guest/host system
export type UserRole = 'guest' | 'host' | 'dual';

export type HostStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface RoleInfo {
  role: UserRole;
  hostStatus?: HostStatus;
  canAccessHostDashboard: boolean;
  hasProperties: boolean;
  isLoading?: boolean;
}
