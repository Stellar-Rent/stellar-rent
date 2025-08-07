/**
 * MODIFICATION SUMMARY - PropertyListingContract Integration
 *
 * Changed: Created complete PropertyListingContract client for blockchain interactions
 * Reason: OnlyDust task requirement to integrate Stellar smart contract with backend property operations
 * Impact: Enables property data to be stored on blockchain with hash-based integrity verification
 * Dependencies: @stellar/stellar-sdk for blockchain interactions, crypto for hash generation
 * Breaking Changes: None - new module with no existing dependencies
 *
 * Key Functions:
 * - generatePropertyHash: Creates SHA-256 hash of essential property data
 * - createPropertyListing: Calls smart contract create_listing function
 * - updatePropertyListingI need help completing the PropertyListingContract integration task assigned from OnlyDust. This is a high-priority MVP task that involves three main components: smart contract completion, Supabase integration, and frontend integration.

**Task Overview:**
Complete the essential PropertyListingContract functionality and integrate it with the existing Supabase backend for the StellarRent MVP.

**Specific Requirements:**

1. **Smart Contract Development (Priority 1):**
   - Complete and thoroughly test the PropertyListingContract functions in `apps/stellar-contracts/`:
     - `create_listing` - Create new property listings on-chain
     - `update_listing` - Update existing property details
     - `update_status` - Change listing status (active/inactive/booked)
     - `get_listing` - Retrieve listing data from blockchain
   - Ensure all functions are properly tested with unit tests
   - Implement proper error handling and validation

2. **Backend Integration (Priority 2):**
   - Integrate PropertyListingContract with the existing Supabase backend in `apps/backend/`
   - Store detailed property information in Supabase database
   - Store property hash and essential metadata on the Stellar blockchain
   - Implement synchronization logic between Supabase and blockchain data
   - Create API endpoints for property CRUD operations that interact with both systems

3. **Frontend Integration (Priority 3):**
   - Update the Next.js frontend in `apps/web/` to display property listings from Supabase
   - Implement blockchain hash verification for data integrity
   - Create basic property management UI for hosts to list and update properties
   - Ensure the frontend works with the existing authentication system (both email and wallet auth)

**Acceptance Criteria:**
- [ ] PropertyListingContract functions are implemented and pass all tests
- [ ] Properties can be created, updated, and retrieved through the API
- [ ] Frontend correctly displays property listings from the database
- [ ] Blockchain hash verification works for data integrity
- [ ] Integration works with existing authentication system

**Additional Requirements:**
- Provide step-by-step instructions for running the project locally
- For each code change, provide a brief, precise description of what was modified and why
- Keep me updated on progress and any blockers encountered
- Ensure the solution is scalable and follows the existing project architecture
- Reference the GitHub issue: https://github.com/Stellar-Rent/stellar-rent/issues/99

**Project Context:**
This task builds upon the existing authentication system and should integrate seamlessly with the current Supabase backend and Next.js frontend architecture.: Calls smart contract update_listing function
 * - updatePropertyStatus: Calls smart contract update_status function
 * - getPropertyListing: Calls smart contract get_listing function
 * - verifyPropertyIntegrity: Compares database data with blockchain hash
 *
 * Related Files:
 * - apps/backend/src/services/property.service.ts (uses this client for blockchain sync)
 * - apps/stellar-contracts/contracts/property-listing/ (smart contract implementation)
 * - apps/web/src/services/blockchain.ts (frontend blockchain utilities)
 *
 * GitHub Issue: https://github.com/Stellar-Rent/stellar-rent/issues/99
 */

import crypto from 'node:crypto';
import * as StellarSdk from '@stellar/stellar-sdk';
import type { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import type { Property } from '../types/property.types';

const useMock = process.env.USE_MOCK === 'true';

// Initialize blockchain-related variables
let sourceKeypair: StellarSdk.Keypair;
let contractId: string;
let server: SorobanRpcServer;
let networkPassphrase: string;

if (!useMock) {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STELLAR_SECRET_KEY environment variable is required');
  }
  sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

  const envContractId = process.env.PROPERTY_LISTING_CONTRACT_ID;
  if (!envContractId) {
    throw new Error('PROPERTY_LISTING_CONTRACT_ID environment variable is required');
  }
  contractId = envContractId;

  const rpcUrl = process.env.SOROBAN_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SOROBAN_RPC_URL environment variable is required');
  }

  // Initialize server with proper error handling
  try {
    const { Server } = require('@stellar/stellar-sdk/rpc');
    server = new Server(rpcUrl);
  } catch (e) {
    console.error('Could not initialize Soroban RPC server:', e);
    throw new Error('Failed to initialize Soroban RPC server');
  }

  networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;
}

export interface PropertyListing {
  id: string;
  data_hash: string;
  owner: string;
  status: 'Available' | 'Booked' | 'Maintenance' | 'Inactive';
}

export interface PropertyHashData {
  title: string;
  price: number;
  address: string;
  city: string;
  country: string;
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
}

/**
 * Generate a hash for property data to store on blockchain
 */
export function generatePropertyHash(property: PropertyHashData): string {
  // Create a consistent string representation of the property data
  const hashData = {
    title: property.title.trim(),
    price: property.price,
    address: property.address.trim(),
    city: property.city.trim(),
    country: property.country.trim(),
    amenities: property.amenities.sort(), // Sort for consistency
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    max_guests: property.max_guests,
  };

  const dataString = JSON.stringify(hashData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Create a property listing on the blockchain
 */
export async function createPropertyListing(
  propertyId: string,
  propertyData: PropertyHashData,
  ownerAddress: string
): Promise<PropertyListing> {
  if (useMock) {
    const dataHash = generatePropertyHash(propertyData);
    return {
      id: propertyId,
      data_hash: dataHash,
      owner: ownerAddress,
      status: 'Available',
    };
  }

  try {
    const contract = new StellarSdk.Contract(contractId);
    const dataHash = generatePropertyHash(propertyData);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const dataHashScVal = StellarSdk.nativeToScVal(dataHash, { type: 'string' });
    const ownerScVal = StellarSdk.nativeToScVal(StellarSdk.Address.fromString(ownerAddress));

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('create_listing', propertyIdScVal, dataHashScVal, ownerScVal))
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);

    const result = await server.sendTransaction(tx);

    if (result.status === 'SUCCESS') {
      return {
        id: propertyId,
        data_hash: dataHash,
        owner: ownerAddress,
        status: 'Available',
      };
    }
    throw new Error(`Transaction failed: ${result.status}`);
  } catch (error) {
    console.error('Blockchain property listing creation failed:', error);
    throw new Error(`Failed to create property listing on blockchain: ${error}`);
  }
}

/**
 * Update a property listing on the blockchain
 */
export async function updatePropertyListing(
  propertyId: string,
  propertyData: PropertyHashData,
  ownerAddress: string
): Promise<PropertyListing> {
  if (useMock) {
    const dataHash = generatePropertyHash(propertyData);
    return {
      id: propertyId,
      data_hash: dataHash,
      owner: ownerAddress,
      status: 'Available',
    };
  }

  try {
    const contract = new StellarSdk.Contract(contractId);
    const dataHash = generatePropertyHash(propertyData);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const dataHashScVal = StellarSdk.nativeToScVal(dataHash, { type: 'string' });
    const ownerScVal = StellarSdk.nativeToScVal(StellarSdk.Address.fromString(ownerAddress));

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('update_listing', propertyIdScVal, dataHashScVal, ownerScVal))
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);

    const result = await server.sendTransaction(tx);

    if (result.status === 'SUCCESS') {
      return {
        id: propertyId,
        data_hash: dataHash,
        owner: ownerAddress,
        status: 'Available',
      };
    }
    throw new Error(`Transaction failed: ${result.status}`);
  } catch (error) {
    console.error('Blockchain property listing update failed:', error);
    throw new Error(`Failed to update property listing on blockchain: ${error}`);
  }
}

/**
 * Update property status on the blockchain
 */
export async function updatePropertyStatus(
  propertyId: string,
  status: 'Available' | 'Booked' | 'Maintenance' | 'Inactive',
  ownerAddress: string
): Promise<PropertyListing> {
  if (useMock) {
    return {
      id: propertyId,
      data_hash: 'mock_hash',
      owner: ownerAddress,
      status,
    };
  }

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const ownerScVal = StellarSdk.nativeToScVal(StellarSdk.Address.fromString(ownerAddress));
    const statusScVal = StellarSdk.nativeToScVal(status, { type: 'symbol' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('update_status', propertyIdScVal, ownerScVal, statusScVal))
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);

    const result = await server.sendTransaction(tx);

    if (result.status === 'SUCCESS') {
      return {
        id: propertyId,
        data_hash: 'updated_hash',
        owner: ownerAddress,
        status,
      };
    }
    throw new Error(`Transaction failed: ${result.status}`);
  } catch (error) {
    console.error('Blockchain property status update failed:', error);
    throw new Error(`Failed to update property status on blockchain: ${error}`);
  }
}

/**
 * Get property listing from the blockchain
 */
export async function getPropertyListing(propertyId: string): Promise<PropertyListing | null> {
  if (useMock) {
    return {
      id: propertyId,
      data_hash: 'mock_hash',
      owner: 'mock_owner',
      status: 'Available',
    };
  }

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('get_listing', propertyIdScVal))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    // Type guard for successful simulation
    if ('results' in sim && Array.isArray(sim.results) && sim.results.length > 0) {
      const xdrResult = sim.results[0].xdr;
      const scVal = StellarSdk.xdr.ScVal.fromXDR(xdrResult, 'base64');
      const result = StellarSdk.scValToNative(scVal);

      if (result) {
        return {
          id: result.id,
          data_hash: result.data_hash,
          owner: result.owner,
          status: result.status,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Blockchain property listing retrieval failed:', error);
    return null;
  }
}

/**
 * Verify property data integrity by comparing hashes
 */
export function verifyPropertyIntegrity(
  propertyData: PropertyHashData,
  blockchainHash: string
): boolean {
  const computedHash = generatePropertyHash(propertyData);
  return computedHash === blockchainHash;
}

/**
 * Convert Property to PropertyHashData for blockchain operations
 */
export function propertyToHashData(property: Property): PropertyHashData {
  return {
    title: property.title,
    price: property.price,
    address: property.location.address,
    city: property.location.city,
    country: property.location.country,
    amenities: property.amenities,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    max_guests: property.maxGuests,
  };
}
