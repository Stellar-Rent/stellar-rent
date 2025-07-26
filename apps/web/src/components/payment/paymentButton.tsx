'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Loader2, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '~/hooks/useWallet';
import { processPayment } from '~/lib/stellar';
import { formatAmount } from '~/lib/utils';
import { bookingAPI } from '~/services/api';

interface PaymentButtonProps {
  bookingId: string;
  amount: string;
  escrowAddress: string;
  onPaymentSuccess?: (transactionHash: string) => void;
  onPaymentError?: (error: string) => void;
}

type PaymentState =
  | 'idle'
  | 'checking_balance'
  | 'creating_tx'
  | 'signing_tx'
  | 'submitting_tx'
  | 'verifying_backend'
  | 'success'
  | 'error';

export default function PaymentButton({
  bookingId,
  amount,
  escrowAddress,
  onPaymentSuccess,
  onPaymentError,
}: PaymentButtonProps) {
  const {
    publicKey,
    usdcBalance,
    isConnected,
    isLoading: walletLoading,
    error: walletError,
    refreshConnection,
  } = useWallet();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayment = async () => {
    setPaymentState('idle');
    setPaymentError(null);

    if (!isConnected || !publicKey) {
      setPaymentError('Wallet not connected. Please connect your wallet first.');
      setPaymentState('error');
      onPaymentError?.('Wallet not connected.');
      return;
    }

    try {
      setPaymentState('checking_balance');
      // Refresh balance to get the latest
      await refreshConnection();

      const currentUSDCBalance = Number.parseFloat(usdcBalance || '0');
      const requiredAmount = Number.parseFloat(amount);

      if (currentUSDCBalance < requiredAmount) {
        setPaymentError(
          `Insufficient USDC balance. You have ${formatAmount(currentUSDCBalance)} USDC, but need ${formatAmount(requiredAmount)} USDC.`
        );
        setPaymentState('error');
        onPaymentError?.('Insufficient balance.');
        return;
      }

      setPaymentState('creating_tx');
      // Process payment (create, sign with Freighter, submit)
      const transactionHash = await processPayment(publicKey, escrowAddress, amount);

      setPaymentState('verifying_backend');
      // Send transaction hash to backend for verification and booking update
      const data = await bookingAPI.confirmBlockchainPayment(
        bookingId,
        transactionHash,
        publicKey,
        escrowAddress
      );

      setPaymentState('success');
      onPaymentSuccess?.(transactionHash);
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setPaymentError(errorMessage);
      setPaymentState('error');
      onPaymentError?.(errorMessage);
    }
  };

  const getButtonContent = () => {
    switch (paymentState) {
      case 'checking_balance':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking balance...
          </>
        );
      case 'creating_tx':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating transaction...
          </>
        );
      case 'signing_tx':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Awaiting wallet signature...
          </>
        );
      case 'submitting_tx':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting transaction...
          </>
        );
      case 'verifying_backend':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying payment...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Payment Successful!
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="mr-2 h-5 w-5" />
            Payment Failed. Try Again.
          </>
        );
      default:
        return (
          <>
            <Wallet className="mr-2 h-5 w-5" /> Pay {formatAmount(Number.parseFloat(amount))} USDC
          </>
        );
    }
  };

  const isDisabled = walletLoading || !isConnected || paymentState !== 'idle';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Confirm Payment</CardTitle>
        <CardDescription>Complete your booking payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Your Wallet Balance (USDC):</span>
          <span className="text-lg font-semibold">
            {walletLoading
              ? 'Loading...'
              : usdcBalance !== null
                ? `${formatAmount(Number.parseFloat(usdcBalance))} USDC`
                : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Amount Due:</span>
          <span className="text-lg font-semibold">
            {formatAmount(Number.parseFloat(amount))} USDC
          </span>
        </div>
        {walletError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {walletError}
          </div>
        )}
        {paymentError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {paymentError}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handlePayment} disabled={isDisabled} className="w-full">
          {getButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
}
