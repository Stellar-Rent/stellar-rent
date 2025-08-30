import {
  Address,
  Asset,
  Contract,
  Horizon,
  Networks,
  type Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk';

const USDC_ISSUER = process.env.USDC_ISSUER;
const USDC_ASSET = new Asset('USDC', USDC_ISSUER);
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

async function checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
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
    const bookingContract = new Contract(process.env.BOOKING_CONTRACT_ADDRESS || '');
    const fromTimestamp = Math.floor(request.dates.from.getTime() / 1000);
    const toTimestamp = Math.floor(request.dates.to.getTime() / 1000);

    const propertyAddress = Address.fromString(request.propertyId);
    const propertyScVal = nativeToScVal(propertyAddress);
    const fromScVal = nativeToScVal(fromTimestamp, { type: 'u64' });
    const toScVal = nativeToScVal(toTimestamp, { type: 'u64' });
    const operation = bookingContract.call('check_availability', propertyScVal, fromScVal, toScVal);

    const account = await rpcServer.getAccount(process.env.STELLAR_SOURCE_ACCOUNT || '');
    const transaction = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simulationResult = await rpcServer.simulateTransaction(transaction);

    if (!rpc.Api.isSimulationSuccess(simulationResult)) {
      throw new Error(`Contract simulation failed: ${JSON.stringify(simulationResult)}`);
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
      `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/////////////////////////////////////////
//Fetches the USDC balance for a given Stellar public key.
////////////////////////////////////////
async function getAccountUSDCBalance(publicKey: string): Promise<string> {
  try {
    const server = new Horizon.Server(
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
    );
    const account = await server.loadAccount(publicKey);

    // Filter for asset balances and then find USDC
    const usdcBalance = account.balances.find((balance) => {
      if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
        // TypeScript should correctly narrow the type here, no explicit assertion needed
        return balance.asset_code === USDC_ASSET.code && balance.asset_issuer === USDC_ASSET.issuer;
      }
      return false;
    });

    return usdcBalance ? usdcBalance.balance : '0';
  } catch (error) {
    console.error(`Error fetching USDC balance for ${publicKey}:`, error);
    // If account not found or other error, assume 0 balance for payment purposes
    return '0';
  }
}

/////////////////////////////////////////
//Verifies a Stellar transaction on Horizon.
////////////////////////////////////////

async function verifyStellarTransaction(
  transactionHash: string,
  expectedSource: string,
  expectedDestination: string,
  expectedAmount: string,
  expectedAssetCode: string
): Promise<boolean> {
  try {
    const server = new Horizon.Server(
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
    );
    const transaction = await server.transactions().transaction(transactionHash).call();

    if (transaction.successful !== true) {
      throw new Error(`Stellar transaction ${transactionHash} was not successful.`);
    }

    if (transaction.source_account !== expectedSource) {
      throw new Error(
        `Transaction source account mismatch. Expected ${expectedSource}, got ${transaction.source_account}`
      );
    }

    const operationsResponse = await server.operations().forTransaction(transactionHash).call();
    const paymentOperation = operationsResponse.records.find((op) => op.type === 'payment');

    if (!paymentOperation) {
      throw new Error(`No payment operation found in transaction ${transactionHash}.`);
    }

    const paymentDetails = paymentOperation as unknown as Operation.Payment;

    if (paymentDetails.destination !== expectedDestination) {
      throw new Error(
        `Payment destination mismatch. Expected ${expectedDestination}, got ${paymentDetails.destination}`
      );
    }

    // Check asset details directly from paymentDetails.asset
    if (paymentDetails.asset.isNative()) {
      throw new Error(`Native (XLM) asset used in payment. Expected ${expectedAssetCode}.`);
    }

    const paymentAsset = paymentDetails.asset as Asset; // Cast to Asset to access code and issuer
    if (paymentAsset.code !== expectedAssetCode) {
      throw new Error(
        `Payment asset code mismatch. Expected ${expectedAssetCode}, got ${paymentAsset.code}`
      );
    }
    if (paymentAsset.issuer !== USDC_ISSUER) {
      throw new Error(
        `Payment asset issuer mismatch. Expected ${USDC_ISSUER}, got ${paymentAsset.issuer}`
      );
    }

    if (Number.parseFloat(paymentDetails.amount) < Number.parseFloat(expectedAmount)) {
      throw new Error(
        `Payment amount too low. Expected at least ${expectedAmount}, got ${paymentDetails.amount}`
      );
    }

    return true;
  } catch (error) {
    console.error(`Error verifying Stellar transaction ${transactionHash}:`, error);
    throw new Error(
      `Transaction verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export { checkAvailability, getAccountUSDCBalance, verifyStellarTransaction };
export type { AvailabilityRequest, AvailabilityResponse };
