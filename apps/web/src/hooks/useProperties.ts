import { type FullPropertyProps, MOCK_PROPERTIES } from 'public/mock-data';
import { useCallback, useEffect, useState } from 'react';

interface UsePropertiesReturn {
  properties: FullPropertyProps[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useProperties = (): UsePropertiesReturn => {
  const [properties, setProperties] = useState<FullPropertyProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProperties(MOCK_PROPERTIES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    refresh: fetchProperties,
  };
};
