import type React from 'react';

interface AvailableBalanceProps {
  balance: number;
  onRequestPayout?: () => void;
}

export const AvailableBalance = ({ balance, onRequestPayout }: AvailableBalanceProps) => {
  return (
    <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-4">Available Balance</h3>
      <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
        <p className="text-4xl font-bold">${balance}</p>
        <p className="text-blue-100 mt-2">Available for withdrawal</p>
      </div>
      <button
        type="button"
        onClick={onRequestPayout}
        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Request Payout
      </button>
    </div>
  );
};
