'use client';

import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NetworkStatusProps {
  isConnected?: boolean;
  lastUpdate?: Date | null;
  showDetails?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isConnected = true,
  lastUpdate,
  showDetails = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Define status configuration with explicit color mappings
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        textColor: 'text-red-500',
        bgColor: 'bg-red-500',
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline',
      };
    }
    if (!isConnected) {
      return {
        textColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Reconnecting...',
      };
    }
    return {
      textColor: 'text-green-500',
      bgColor: 'bg-green-500',
      icon: <Wifi className="w-4 h-4" />,
      text: 'Connected',
    };
  };

  const statusConfig = getStatusConfig();

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-1 ${statusConfig.textColor}`}>
        {statusConfig.icon}
        <span className="text-xs font-medium">{statusConfig.text}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0B1D39] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {statusConfig.icon}
          <div>
            <p className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.text}</p>
            {lastUpdate && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor}`} />
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
