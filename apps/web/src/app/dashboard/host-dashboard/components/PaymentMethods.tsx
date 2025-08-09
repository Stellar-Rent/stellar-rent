'use client';
import { Edit3 } from 'lucide-react';
import type React from 'react';

export const PaymentMethods: React.FC = () => {
  return (
    <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold dark:text-white text-gray-900">Payment Methods</h3>
        <button
          type="button"
          className="text-blue-600 dark:text-white hover:text-blue-700 text-sm font-medium"
        >
          + Add New
        </button>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="font-medium dark:text-white text-gray-900">•••• •••• •••• 4532</p>
              <p className="text-sm dark:text-white text-gray-500">Expires 12/26</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Primary
          </span>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">BANK</span>
            </div>
            <div>
              <p className="font-medium dark:text-white text-gray-900">Chase Bank ••••9876</p>
              <p className="text-sm dark:text-white text-gray-500">Checking Account</p>
            </div>
          </div>
          <button type="button" className="text-gray-400 hover:text-gray-600">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
