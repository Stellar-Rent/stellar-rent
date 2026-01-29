import { Keypair } from '@stellar/stellar-sdk';
import axios, { type AxiosResponse } from 'axios';
import { EscrowError } from '../types/errors';

const TRUSTLESS_WORK_API_URL =
  process.env.TRUSTLESS_WORK_API_URL || 'https://api.trustlesswork.com';
const TRUSTLESS_WORK_API_KEY = process.env.TRUSTLESS_WORK_API_KEY;
const STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';

export interface CreateEscrowRequest {
  buyer: string;
  seller: string;
  arbiter?: string;
  amount: string;
  asset: string;
  issuer: string;
  title: string;
  description: string;
  metadata?: {
    propertyId: string;
    bookingId: string;
    dates: {
      from: string;
      to: string;
    };
    guests: number;
  };
  milestones?: EscrowMilestone[];
  autoRelease?: boolean;
  releaseAfter?: number;
}

export interface EscrowMilestone {
  title: string;
  description: string;
  amount: string;
  dueDate?: string;
}

export interface CreateEscrowResponse {
  success: boolean;
  escrowId: string;
  escrowAddress: string;
  contractId: string;
  status: 'created' | 'pending' | 'funded' | 'completed' | 'disputed';
  txHash?: string;
  message?: string;
}

export interface EscrowStatus {
  escrowId: string;
  status: 'created' | 'pending' | 'funded' | 'completed' | 'disputed' | 'cancelled';
  amount: string;
  funded: string;
  buyer: string;
  seller: string;
  arbiter?: string;
  createdAt: string;
  updatedAt: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  metadata?: any;
}

export interface FundEscrowRequest {
  escrowId: string;
  amount: string;
  txHash?: string;
}

export interface ReleaseEscrowRequest {
  escrowId: string;
  amount?: string;
  reason?: string;
}

export class TrustlessWorkClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || TRUSTLESS_WORK_API_URL;
    this.apiKey = apiKey || TRUSTLESS_WORK_API_KEY || '';

    // Only throw error in production, allow test mode with empty key
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('TrustlessWork API key is required');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'X-API-Version': 'v1',
    };
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: this.getHeaders(),
        data,
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        const status = error.response?.status;
        throw new Error(`TrustlessWork API Error (${status}): ${message}`);
      }
      throw error;
    }
  }

  async createEscrow(request: CreateEscrowRequest): Promise<CreateEscrowResponse> {
    this.validateCreateEscrowRequest(request);

    const payload = {
      ...request,
      network: STELLAR_NETWORK,
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest<CreateEscrowResponse>('POST', '/escrows', payload);
  }

  async getEscrowStatus(escrowId: string): Promise<EscrowStatus> {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return this.makeRequest<EscrowStatus>('GET', `/escrows/${escrowId}`);
  }

  async fundEscrow(request: FundEscrowRequest): Promise<{ success: boolean; txHash?: string }> {
    if (!request.escrowId || !request.amount) {
      throw new Error('Escrow ID and amount are required for funding');
    }

    return this.makeRequest('POST', `/escrows/${request.escrowId}/fund`, {
      amount: request.amount,
      txHash: request.txHash,
    });
  }

  async releaseEscrow(
    request: ReleaseEscrowRequest
  ): Promise<{ success: boolean; txHash?: string }> {
    if (!request.escrowId) {
      throw new Error('Escrow ID is required for release');
    }

    return this.makeRequest('POST', `/escrows/${request.escrowId}/release`, {
      amount: request.amount,
      reason: request.reason,
    });
  }

  async cancelEscrow(escrowId: string, reason?: string): Promise<{ success: boolean }> {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return this.makeRequest('POST', `/escrows/${escrowId}/cancel`, { reason });
  }

  private validateCreateEscrowRequest(request: CreateEscrowRequest): void {
    const errors: string[] = [];

    if (!request.buyer) errors.push('Buyer address is required');
    if (!request.seller) errors.push('Seller address is required');
    if (!request.amount || Number.parseFloat(request.amount) <= 0) {
      errors.push('Valid amount is required');
    }
    if (!request.asset) errors.push('Asset code is required');
    if (!request.issuer) errors.push('Asset issuer is required');
    if (!request.title) errors.push('Escrow title is required');
    if (!request.description) errors.push('Escrow description is required');

    try {
      Keypair.fromPublicKey(request.buyer);
    } catch {
      errors.push('Invalid buyer Stellar address');
    }

    try {
      Keypair.fromPublicKey(request.seller);
    } catch {
      errors.push('Invalid seller Stellar address');
    }

    if (request.arbiter) {
      try {
        Keypair.fromPublicKey(request.arbiter);
      } catch {
        errors.push('Invalid arbiter Stellar address');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }
}

export interface BookingEscrowParams {
  propertyId: string;
  bookingId: string;
  buyerAddress: string;
  sellerAddress: string;
  totalAmount: number;
  depositAmount: number;
  dates: {
    from: Date;
    to: Date;
  };
  guests: number;
  propertyTitle: string;
  arbiterAddress?: string;
}

export interface EscrowResult {
  escrowId: string;
  escrowAddress: string;
  contractId: string;
  status: string;
  totalAmount: string;
  success: boolean;
  error?: string;
}

export async function createEscrow(params: BookingEscrowParams): Promise<string> {
  try {
    if (!params.propertyId || !params.bookingId) {
      throw new Error('Property ID and Booking ID are required');
    }

    if (!params.buyerAddress || !params.sellerAddress) {
      throw new Error('Buyer and seller Stellar addresses are required');
    }

    if (params.totalAmount <= 0 || params.depositAmount < 0) {
      throw new Error('Invalid amount values');
    }

    if (params.dates.to <= params.dates.from) {
      throw new Error('Invalid date range');
    }

    const client = new TrustlessWorkClient();

    const escrowRequest: CreateEscrowRequest = {
      buyer: params.buyerAddress,
      seller: params.sellerAddress,
      arbiter: params.arbiterAddress,
      amount: params.totalAmount.toFixed(2),
      asset: 'USDC',
      issuer: getUSDCIssuer(),
      title: `StellarRent Booking: ${params.propertyTitle}`,
      description: `Escrow for property rental booking from ${
        params.dates.from.toISOString().split('T')[0]
      } to ${params.dates.to.toISOString().split('T')[0]} for ${
        params.guests
      } guest(s). Total: ${params.totalAmount.toFixed(
        2
      )} (includes ${params.depositAmount.toFixed(2)} security deposit).`,
      metadata: {
        propertyId: params.propertyId,
        bookingId: params.bookingId,
        dates: {
          from: params.dates.from.toISOString().split('T')[0] ?? '',
          to: params.dates.to.toISOString().split('T')[0] ?? '',
        },
        guests: params.guests,
      },
      milestones: [
        {
          title: 'Check-in Payment',
          description: 'Payment released upon successful check-in',
          amount: (params.totalAmount - params.depositAmount).toFixed(2),
        },
        {
          title: 'Security Deposit',
          description: 'Deposit held for property damage protection',
          amount: params.depositAmount.toFixed(2),
        },
      ],
      autoRelease: false,
    };

    const response = await client.createEscrow(escrowRequest);

    if (!response.success) {
      throw new Error('Failed to create escrow');
    }

    return response.escrowAddress;
  } catch (error) {
    throw new EscrowError('Failed to create escrow', 'CREATE_ESCROW_FAIL', error);
  }
}

export async function createEscrowWithDetails(params: BookingEscrowParams): Promise<EscrowResult> {
  try {
    const escrowAddress = await createEscrow(params);

    return {
      escrowId: '',
      escrowAddress,
      contractId: '',
      status: 'created',
      totalAmount: params.totalAmount.toFixed(2),
      success: true,
    };
  } catch (error) {
    return {
      escrowId: '',
      escrowAddress: '',
      contractId: '',
      status: 'failed',
      totalAmount: params.totalAmount.toFixed(2),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function getUSDCIssuer(): string {
  if (STELLAR_NETWORK === 'mainnet') {
    return 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  }
  return 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
}

export class EscrowManager {
  private client: TrustlessWorkClient;

  constructor() {
    this.client = new TrustlessWorkClient();
  }

  async isEscrowReady(escrowId: string): Promise<boolean> {
    const status = await this.client.getEscrowStatus(escrowId);
    return status.status === 'created' || status.status === 'pending';
  }

  async getEscrowDetails(escrowId: string): Promise<EscrowStatus> {
    return await this.client.getEscrowStatus(escrowId);
  }

  async releasePayment(escrowId: string, amount?: number): Promise<boolean> {
    const result = await this.client.releaseEscrow({
      escrowId,
      amount: amount?.toFixed(2),
      reason: 'Successful check-in completed',
    });

    if (!result.success) {
      throw new EscrowError('Failed to release payment', 'RELEASE_PAYMENT_FAIL', {
        escrowId,
        amount,
      });
    }

    return result.success;
  }

  async releaseDeposit(escrowId: string, amount?: number): Promise<boolean> {
    const result = await this.client.releaseEscrow({
      escrowId,
      amount: amount?.toFixed(2),
      reason: 'Successful checkout, no damages',
    });

    if (!result.success) {
      throw new EscrowError('Failed to release deposit', 'RELEASE_DEPOSIT_FAIL', {
        escrowId,
        amount,
      });
    }

    return result.success;
  }
}

export const trustlessWorkClient = new TrustlessWorkClient();
