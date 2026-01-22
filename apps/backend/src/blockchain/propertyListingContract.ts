/**
 * PropertyListingContract - Blockchain integration for property listings
 *
 * This module handles all interactions with the Stellar PropertyListingContract smart contract.
 * Properties are stored in the database with a hash stored on-chain for integrity verification.
 *
 * Key Functions:
 * - createPropertyListing: Register property listing on-chain with hash
 * - updatePropertyListing: Update property listing on-chain
 * - updatePropertyStatus: Change listing status (Available/Booked/Maintenance/Inactive)
 * - getPropertyListing: Retrieve property listing from blockchain
 * - verifyPropertyIntegrity: Verify database property matches blockchain hash
 */

import crypto from 'node:crypto';
import * as StellarSdk from '@stellar/stellar-sdk';
import type { Property } from '../types/property.types';
import { getSorobanConfig } from './config';
import {
  buildTransaction,
  submitAndConfirmTransaction,
  retryOperation,
  simulateTransaction,
} from './transactionUtils';
import { classifyError, ContractError } from './errors';

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
  const config = getSorobanConfig();

  if (config.useMock) {
    const dataHash = generatePropertyHash(propertyData);
    return {
      id: propertyId,
      data_hash: dataHash,
      owner: ownerAddress,
      status: 'Available',
    };
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.property);
        const dataHash = generatePropertyHash(propertyData);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const dataHashScVal = StellarSdk.nativeToScVal(dataHash, { type: 'string' });
        const ownerScVal = StellarSdk.nativeToScVal(StellarSdk.Address.fromString(ownerAddress));

        const operation = contract.call(
          'create_listing',
          propertyIdScVal,
          dataHashScVal,
          ownerScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.property,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        if (result.status === 'SUCCESS') {
          return {
            id: propertyId,
            data_hash: dataHash,
            owner: ownerAddress,
            status: 'Available',
          };
        }

        throw new ContractError(
          `Transaction failed: ${result.status}`,
          config.contractIds.property
        );
      },
      config
    );
  } catch (error) {
    console.error('Blockchain property listing creation failed:', error);
    throw classifyError(error);
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
  const config = getSorobanConfig();

  if (config.useMock) {
    const dataHash = generatePropertyHash(propertyData);
    return {
      id: propertyId,
      data_hash: dataHash,
      owner: ownerAddress,
      status: 'Available',
    };
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.property);
        const dataHash = generatePropertyHash(propertyData);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const dataHashScVal = StellarSdk.nativeToScVal(dataHash, { type: 'string' });
        const ownerScVal = StellarSdk.nativeToScVal(StellarSdk.Address.fromString(ownerAddress));

        const operation = contract.call(
          'update_listing',
          propertyIdScVal,
          dataHashScVal,
          ownerScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.property,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        if (result.status === 'SUCCESS') {
          return {
            id: propertyId,
            data_hash: dataHash,
            owner: ownerAddress,
            status: 'Available',
          };
        }

        throw new ContractError(
          `Transaction failed: ${result.status}`,
          config.contractIds.property
        );
      },
      config
    );
  } catch (error) {
    console.error('Blockchain property listing update failed:', error);
    throw classifyError(error);
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
  const config = getSorobanConfig();

  if (config.useMock) {
    return {
      id: propertyId,
      data_hash: 'mock_hash',
      owner: ownerAddress,
      status,
    };
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.property);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const ownerScVal = StellarSdk.nativeToScVal(
          StellarSdk.Address.fromString(ownerAddress)
        );
        const statusScVal = StellarSdk.nativeToScVal(status, { type: 'symbol' });

        const operation = contract.call(
          'update_status',
          propertyIdScVal,
          ownerScVal,
          statusScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.property,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        if (result.status === 'SUCCESS') {
          return {
            id: propertyId,
            data_hash: 'updated_hash',
            owner: ownerAddress,
            status,
          };
        }

        throw new ContractError(
          `Transaction failed: ${result.status}`,
          config.contractIds.property
        );
      },
      config
    );
  } catch (error) {
    console.error('Blockchain property status update failed:', error);
    throw classifyError(error);
  }
}

/**
 * Get property listing from the blockchain
 */
export async function getPropertyListing(propertyId: string): Promise<PropertyListing | null> {
  const config = getSorobanConfig();

  if (config.useMock) {
    return {
      id: propertyId,
      data_hash: 'mock_hash',
      owner: 'mock_owner',
      status: 'Available',
    };
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.property);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });

        const operation = contract.call('get_listing', propertyIdScVal);

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.default,
        });

        const result = await simulateTransaction(tx, config.rpcServer);

        if (result) {
          return {
            id: result.id,
            data_hash: result.data_hash,
            owner: result.owner,
            status: result.status,
          };
        }

        return null;
      },
      config
    );
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
