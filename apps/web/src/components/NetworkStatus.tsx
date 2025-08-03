'use client';

import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (!isConnected) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (!isConnected) return <AlertCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isConnected) return 'Reconnecting...';
    return 'Connected';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0B1D39] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {lastUpdate && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
