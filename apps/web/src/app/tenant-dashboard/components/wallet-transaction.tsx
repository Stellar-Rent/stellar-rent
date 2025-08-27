import { Clock, CreditCard, Download, Wallet } from 'lucide-react';
import type { Transaction } from '@/types';

interface PaymentMethod {
  type: string;
  last4: string;
  expiryDate: string;
}

interface WalletTransactionsProps {
  walletBalance: number;
  pendingTransactions: number;
  transactions: Transaction[];
  onExportTransactions: () => void;
  paymentMethod?: PaymentMethod;
}

const WalletTransactions: React.FC<WalletTransactionsProps> = ({
  walletBalance,
  pendingTransactions,
  transactions,
  onExportTransactions,
  paymentMethod,
}) => {
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-red-600';
      case 'refund':
        return 'text-green-600';
      case 'deposit':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'refund' || type === 'deposit' ? '+' : '-';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet & Payments</h2>
        <p className="text-gray-600 dark:text-white mt-1">
          Manage your balance and transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Available Balance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${walletBalance.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${pendingTransactions.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Payment Method</p>
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          {paymentMethod ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {paymentMethod.type.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  •••• {paymentMethod.last4}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Expires {paymentMethod.expiryDate}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                No payment method added
              </p>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h3>
            <button
              type="button"
              onClick={onExportTransactions}
              className="text-blue-600 hover:text-blue-700 flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0B1D39]/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#0B1D39] divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.description}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTransactionColor(
                      transaction.type
                    )}`}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-white">
              Your transaction history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletTransactions;
