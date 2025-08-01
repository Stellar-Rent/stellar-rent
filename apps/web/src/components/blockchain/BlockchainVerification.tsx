'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPropertyBlockchainStatus,
  formatBlockchainStatus,
  truncateHash,
  copyHashToClipboard,
  getBlockchainExplorerUrl,
  isBlockchainEnabled,
  getBlockchainNetwork,
  type PropertyBlockchainStatus,
} from '../../services/blockchain';

interface BlockchainVerificationProps {
  propertyId: string;
  className?: string;
}

export function BlockchainVerification({ propertyId, className }: BlockchainVerificationProps) {
  const [status, setStatus] = useState<PropertyBlockchainStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
        error: 'Failed to load verification status',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const blockchainStatus = await getPropertyBlockchainStatus(propertyId);
      setStatus(blockchainStatus);
      
      if (blockchainStatus.isVerified) {
        toast.success('Property data verified on blockchain');
      } else {
        toast.error('Property verification failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = async () => {
    if (status?.blockchainHash) {
      const success = await copyHashToClipboard(status.blockchainHash);
      if (success) {
        toast.success('Hash copied to clipboard');
      } else {
        toast.error('Failed to copy hash');
      }
    }
  };

  const handleOpenExplorer = () => {
    if (status?.blockchainHash) {
      const url = getBlockchainExplorerUrl(status.blockchainHash);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    loadStatus();
  }, [propertyId]);

  if (isLoading && !status) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading blockchain status...</span>
        </div>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const statusDisplay = formatBlockchainStatus(status);
  const network = getBlockchainNetwork();

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Blockchain Verification</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {network.toUpperCase()}
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          {status.isVerified ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : status.error ? (
            <XCircle className="w-4 h-4 text-red-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          )}
          <span 
            className={`text-sm font-medium ${
              status.isVerified 
                ? 'text-green-700' 
                : status.error 
                ? 'text-red-700' 
                : 'text-yellow-700'
            }`}
          >
            {statusDisplay.text}
          </span>
        </div>

        {/* Hash Display */}
        {status.blockchainHash && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Blockchain Hash
            </label>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
              <code className="text-xs font-mono text-gray-700 flex-1">
                {truncateHash(status.blockchainHash, 12)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyHash}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExplorer}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-xs text-red-700">{status.error}</p>
          </div>
        )}

        {/* Last Verified */}
        {status.lastVerified && (
          <p className="text-xs text-gray-500">
            Last verified: {new Date(status.lastVerified).toLocaleString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify Now'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
