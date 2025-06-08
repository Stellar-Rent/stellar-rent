import {
  rpc,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Networks,
} from '@stellar/stellar-sdk';

interface AvailabilityRequest {
  propertyId: string;
  dates: {
    from: Date;
    to: Date;
  };
}

interface AvailabilityResponse {
  isAvailable: boolean;
  conflictingBookings?: Array<{
    bookingId: string;
    dates: {
      from: Date;
      to: Date;
    };
  }>;
}

async function checkAvailability(
  request: AvailabilityRequest
): Promise<AvailabilityResponse> {
  try {
    const now = new Date();
    if (request.dates.from < now) {
      throw new Error('Start date must be in the future');
    }
    if (request.dates.to <= request.dates.from) {
      throw new Error('End date must be after start date');
    }
    const rpcServer = new rpc.Server(
      process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
    );
    const bookingContract = new Contract(
      process.env.BOOKING_CONTRACT_ADDRESS || ''
    );
    const fromTimestamp = Math.floor(request.dates.from.getTime() / 1000);
    const toTimestamp = Math.floor(request.dates.to.getTime() / 1000);

    const propertyAddress = Address.fromString(request.propertyId);
    const propertyScVal = nativeToScVal(propertyAddress);
    const fromScVal = nativeToScVal(fromTimestamp, { type: 'u64' });
    const toScVal = nativeToScVal(toTimestamp, { type: 'u64' });
    const operation = bookingContract.call(
      'check_availability',
      propertyScVal,
      fromScVal,
      toScVal
    );

    const account = await rpcServer.getAccount(
      process.env.STELLAR_SOURCE_ACCOUNT || ''
    );
    const transaction = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase:
        process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulationResult = await rpcServer.simulateTransaction(transaction);

    if (!rpc.Api.isSimulationSuccess(simulationResult)) {
      throw new Error(
        `Contract simulation failed: ${JSON.stringify(simulationResult)}`
      );
    }

    const contractResult = simulationResult.result?.retval;
    if (!contractResult) {
      throw new Error('No result returned from contract');
    }

    const availabilityData = scValToNative(contractResult);
    if (availabilityData.is_available) {
      return {
        isAvailable: true,
      };
    }
    const conflictingBookings =
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      availabilityData.conflicting_bookings?.map((booking: any) => ({
        bookingId: booking.id,
        dates: {
          from: new Date(booking.from_timestamp * 1000),
          to: new Date(booking.to_timestamp * 1000),
        },
      })) || [];

    return {
      isAvailable: false,
      conflictingBookings,
    };
  } catch (error) {
    console.error('Availability check failed:', error);
    throw new Error(
      `Failed to check availability: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export { checkAvailability };
export type { AvailabilityRequest, AvailabilityResponse };
