import type React from 'react';

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PayoutHistoryProps {
  payouts?: PayoutRecord[];
}

const defaultPayouts: PayoutRecord[] = [
  {
    id: '1',
    date: 'May 25, 2025',
    amount: 1850,
    method: 'Chase Bank ••••9876',
    status: 'completed',
  },
  {
    id: '2',
    date: 'May 11, 2025',
    amount: 2340,
    method: '•••• •••• •••• 4532',
    status: 'completed',
  },
  {
    id: '3',
    date: 'Apr 28, 2025',
    amount: 1920,
    method: 'Chase Bank ••••9876',
    status: 'completed',
  },
];

export const PayoutHistory = ({ payouts = defaultPayouts }: PayoutHistoryProps) => {
  return (
    <div className="mt-8 bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold dark:text-white text-gray-900">Payout History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-card/90 dark:text-foreground">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-card/90 dark:text-foreground divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id} className="">
                <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">
                  {payout.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">
                  ${payout.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">
                  {payout.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payout.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {payout.status === 'completed' ? 'Completed' : payout.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
