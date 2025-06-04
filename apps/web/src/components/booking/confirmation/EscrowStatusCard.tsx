'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { getEstimatedTimeToNextStatus, useEscrowStatus } from '@/hooks/useEscrowStatus';
import { CheckCircle, Clock, ExternalLink, Shield, XCircle } from 'lucide-react';

type EscrowStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface EscrowStatusCardProps {
  escrowStatus: EscrowStatus;
  transactionHash: string;
  totalAmount: number;
  bookingId?: string;
}

export function EscrowStatusCard({
  escrowStatus: initialStatus,
  transactionHash,
  totalAmount,
  bookingId = 'default',
}: EscrowStatusCardProps) {
  const { escrowData } = useEscrowStatus(bookingId, initialStatus);

  const currentStatus = escrowData?.status || initialStatus;
  const lastUpdated = escrowData?.lastUpdated || new Date();

  const getStatusConfig = (status: EscrowStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          title: 'Payment Pending',
          description: 'Your payment is being processed and will be held in escrow until check-in.',
          progress: 25,
        };
      case 'confirmed':
        return {
          icon: Shield,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          title: 'Payment Secured',
          description:
            'Your payment is now safely held in escrow and will be released to the host after your stay.',
          progress: 75,
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          title: 'Payment Released',
          description: 'Your stay is complete and payment has been released to the host.',
          progress: 100,
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Payment Refunded',
          description: 'Your booking was cancelled and payment has been refunded.',
          progress: 0,
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;

  const openTransactionExplorer = () => {
    window.open(`https://stellar.expert/explorer/testnet/tx/${transactionHash}`, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Payment Status</h2>
          <div className="text-xs text-muted-foreground">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>

      <div className="px-6 pb-6 space-y-6">
        {/* Status Display */}
        <div
          className={`p-4 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
            <div>
              <h3 className="font-semibold text-foreground">{statusConfig.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{statusConfig.description}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`bg-[#4A90E2] h-2 rounded-full transition-all duration-500 ease-out ${
                statusConfig.progress === 25
                  ? 'w-1/4'
                  : statusConfig.progress === 75
                    ? 'w-3/4'
                    : statusConfig.progress === 100
                      ? 'w-full'
                      : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-foreground">Escrow Amount</span>
            <span className="text-lg font-bold text-foreground">
              ${totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction Hash</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={openTransactionExplorer}
                className="h-auto p-0 text-[#4A90E2] hover:text-[#357ABD]"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Explorer
              </Button>
            </div>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all text-muted-foreground">
              {transactionHash}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Payment Timeline</h4>
          <div className="space-y-2">
            {[
              { status: 'pending', label: 'Payment Initiated', completed: true },
              {
                status: 'confirmed',
                label: 'Funds Secured in Escrow',
                completed: currentStatus !== 'pending',
              },
              {
                status: 'completed',
                label: 'Payment Released to Host',
                completed: currentStatus === 'completed',
              },
            ].map((step) => (
              <div key={step.status} className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    step.completed ? 'bg-[#4A90E2]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <span
                  className={`text-sm ${
                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
