'use client';

import { AlertTriangle, CheckCircle, RefreshCw, Shield, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  getPropertyBlockchainStatus,
  isBlockchainEnabled,
  type PropertyBlockchainStatus,
} from '../../services/blockchain';

interface BlockchainStatusBadgeProps {
  propertyId: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BlockchainStatusBadge({
  propertyId,
  className = '',
  showIcon = true,
  size = 'sm',
}: BlockchainStatusBadgeProps) {
  const [status, setStatus] = useState<PropertyBlockchainStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Don't render if blockchain features are disabled
  if (!isBlockchainEnabled()) {
    return null;
  }

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const blockchainStatus = await getPropertyBlockchainStatus(propertyId);
      setStatus(blockchainStatus);
    } catch (error) {
      console.error('Failed to load blockchain status:', error);
      setStatus({
        isVerified: false,
        error: 'Failed to load status',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadStatus();
    }
  }, [propertyId, loadStatus]);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`${className} ${getSizeClasses(size)}`}>
        {showIcon && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
        <span>Checking...</span>
      </Badge>
    );
  }

  if (!status) {
    return null;
  }

  const { variant, icon: IconComponent, text } = getStatusDisplay(status);

  return (
    <Badge variant={variant} className={`${className} ${getSizeClasses(size)}`}>
      {showIcon && IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
      <span>{text}</span>
    </Badge>
  );
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-xs px-2 py-1';
    case 'md':
      return 'text-sm px-3 py-1';
    case 'lg':
      return 'text-base px-4 py-2';
    default:
      return 'text-xs px-2 py-1';
  }
}

function getStatusDisplay(status: PropertyBlockchainStatus): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }> | null;
  text: string;
} {
  if (status.error) {
    return {
      variant: 'destructive',
      icon: XCircle,
      text: 'Verification Failed',
    };
  }

  if (status.isVerified) {
    return {
      variant: 'default',
      icon: CheckCircle,
      text: 'Blockchain Verified',
    };
  }

  return {
    variant: 'secondary',
    icon: AlertTriangle,
    text: 'Not Verified',
  };
}

// Compact version for use in lists
export function BlockchainStatusIcon({
  propertyId,
  className = '',
  size = 16,
}: {
  propertyId: string;
  className?: string;
  size?: number;
}) {
  const [status, setStatus] = useState<PropertyBlockchainStatus | null>(null);

  if (!isBlockchainEnabled()) {
    return null;
  }

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const blockchainStatus = await getPropertyBlockchainStatus(propertyId);
        setStatus(blockchainStatus);
      } catch (error) {
        console.error('Failed to load blockchain status:', error);
      }
    };

    if (propertyId) {
      loadStatus();
    }
  }, [propertyId]);

  if (!status) {
    return (
      <Shield
        className={`${className} text-gray-400`}
        size={size}
        title="Blockchain status unknown"
      />
    );
  }

  if (status.error) {
    return (
      <XCircle
        className={`${className} text-red-500`}
        size={size}
        title="Blockchain verification failed"
      />
    );
  }

  if (status.isVerified) {
    return (
      <CheckCircle
        className={`${className} text-green-500`}
        size={size}
        title="Verified on blockchain"
      />
    );
  }

  return (
    <AlertTriangle
      className={`${className} text-yellow-500`}
      size={size}
      title="Not verified on blockchain"
    />
  );
}
