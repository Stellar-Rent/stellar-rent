export interface UserProfileUpdate {
  email?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  };
  preferences?: {
    notifications?: boolean;
    newsletter?: boolean;
    language?: string;
  };
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  verification_status?: 'unverified' | 'pending' | 'verified';
  last_active?: Date;
}
