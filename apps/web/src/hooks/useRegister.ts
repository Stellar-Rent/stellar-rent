import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RegisterFormData } from '../validations/auth.schema';
import { useAuth } from './auth/use-auth';

export const useRegister = () => {
  const router = useRouter();
  const { register: authRegister, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await authRegister(data.email, data.password, data.fullName);

      // Redirect to dashboard after successful registration
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading: isLoading || authLoading,
    error,
  };
};
