import { Contract, nativeToScVal } from '@stellar/stellar-sdk';

const contractId = process.env.SOROBAN_CONTRACT_ID;
if (!contractId) {
  throw new Error('BOOKING_CONTRACT_ID environment variable is required');
}

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  const startDate = Math.floor(new Date(from).getTime() / 1000);
  const endDate = Math.floor(new Date(to).getTime() / 1000);
  const contract = new Contract(contractId as string);

  try {
    // Call the contract's check_availability function
    // You may need to adjust argument types depending on your contract's ABI
    const propertyIdScVal = nativeToScVal(propertyId, { type: 'string' });
    const startDateScVal = nativeToScVal(startDate, { type: 'i64' });
    const endDateScVal = nativeToScVal(endDate, { type: 'i64' });
    const result = contract.call(
      'check_availability',
      propertyIdScVal,
      startDateScVal,
      endDateScVal
    );
    // Adjust result parsing as needed for your contract/network
    return Boolean(result);
  } catch (error) {
    console.error('Blockchain availability check failed:', error);
    // Fail closed: treat as unavailable if blockchain call fails
    return false;
  }
}
