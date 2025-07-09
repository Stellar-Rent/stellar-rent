'use client';

import { AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function NetworkStatus() {
  const { network, isConnected, isLoading } = useWallet();

  if (isLoading || !isConnected) {
    return null;
  }

  const getNetworkInfo = () => {
    switch (network?.toUpperCase()) {
      case 'TESTNET':
      case 'TEST':
        return {
          name: 'Testnet',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: CheckCircle,
          description: 'Safe for testing',
        };
      case 'PUBLIC':
      case 'MAINNET':
        return {
          name: 'Mainnet',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          description: 'Live network',
        };
      case 'FUTURENET':
        return {
          name: 'Futurenet',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          icon: AlertTriangle,
          description: 'Experimental',
        };
      default:
        return {
          name: 'Unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: Globe,
          description: 'Unknown network',
        };
    }
  };

  const networkInfo = getNetworkInfo();
  const IconComponent = networkInfo.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${networkInfo.bgColor} ${networkInfo.borderColor}`}
    >
      <IconComponent className={`h-3 w-3 ${networkInfo.color}`} />
      <span className={networkInfo.color}>{networkInfo.name}</span>
      <span className="text-gray-500 dark:text-gray-400">{networkInfo.description}</span>
    </div>
  );
}
