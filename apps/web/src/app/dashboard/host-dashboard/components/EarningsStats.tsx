import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

interface EarningsStatsProps {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
}

export const EarningsStats = ({
  totalEarnings,
  monthlyEarnings,
  pendingPayouts,
}: EarningsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Total Earnings</p>
            <p className="text-3xl font-bold dark:text-white text-gray-900">${totalEarnings}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-green-600 font-medium">+12%</span>
          <span className="text-gray-600 dark:text-white ml-2">from last month</span>
        </div>
      </div>

      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">This Month</p>
            <p className="text-3xl font-bold dark:text-white text-gray-900">${monthlyEarnings}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-blue-600 font-medium">+8%</span>
          <span className="text-gray-600 dark:text-white ml-2">from last month</span>
        </div>
      </div>

      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Pending Payouts</p>
            <p className="text-3xl font-bold dark:text-white text-gray-900">${pendingPayouts}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <Wallet className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-gray-600 dark:text-white">Next payout in 3 days</span>
        </div>
      </div>
    </div>
  );
};
