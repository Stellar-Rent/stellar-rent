/**
 * Logging Service
 *
 * Provides comprehensive logging capabilities for blockchain operations and transactions.
 * Handles proper serialization of Error objects and complex data structures.
 *
 * Features:
 * - Error object serialization with stack traces
 * - Circular reference detection and handling
 * - Complex object sanitization for database storage
 * - Support for various data types (Buffer, Map, Set, etc.)
 * - Graceful fallback for unserializable data
 *
 * Database Fields:
 * - operation: The operation being logged
 * - status: Operation status (started, completed, failed)
 * - message: JSON stringified details for text search
 * - data: Sanitized operation details
 * - error_details: Properly serialized error information
 * - created_at: Timestamp of the log entry
 */

import { supabase } from '../config/supabase';
import type { TransactionLog } from '../types/common.types';

class LoggingService {
  private logToConsole(log: TransactionLog) {
    console.log(JSON.stringify(log, null, 2));
  }

  private async logToDatabase(log: TransactionLog) {
    try {
      await supabase.from('sync_logs').insert({
        operation: log.operation,
        status: log.status,
        message: log.details ? JSON.stringify(log.details) : null,
        data: this.sanitizeValue(log.details),
        error_details: this.serializeError(log.error),
        created_at: log.timestamp,
      });
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  /**
   * Serialize error objects to capture all relevant error information
   * including non-enumerable properties like stack traces
   */
  private serializeError(error: unknown): Record<string, unknown> | null {
    if (!error) {
      return null;
    }

    try {
      // If it's already a plain object, return it as is
      if (error && typeof error === 'object' && !(error instanceof Error)) {
        return this.sanitizeObject(error as Record<string, unknown>);
      }

      // If it's an Error object, extract all relevant properties
      if (error instanceof Error) {
        const serializedError: Record<string, unknown> = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        };

        // Add any additional custom properties that might exist on the error
        // This handles custom error classes that extend Error
        const errorKeys = Object.getOwnPropertyNames(error);
        for (const key of errorKeys) {
          if (!['name', 'message', 'stack', 'cause'].includes(key)) {
            try {
              const value = (error as Record<string, unknown>)[key];
              // Only include serializable values
              if (value !== undefined && value !== null) {
                serializedError[key] = this.sanitizeValue(value);
              }
            } catch (e) {
              // Skip properties that can't be accessed
              console.warn(`Could not serialize error property '${key}':`, e);
            }
          }
        }

        return serializedError;
      }

      // For primitive values, wrap them in an object
      if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
        return { value: error };
      }

      // For other types, try to convert to string
      return {
        value: String(error),
        type: typeof error,
        constructor: error?.constructor?.name || 'unknown',
      };
    } catch (serializationError) {
      console.error('Failed to serialize error:', serializationError);
      // Fallback: return basic error information
      return {
        serializationError: 'Failed to serialize original error',
        originalErrorType: typeof error,
        originalErrorConstructor: error?.constructor?.name || 'unknown',
        fallbackMessage: String(error),
      };
    }
  }

  /**
   * Sanitize object values to ensure they can be safely stored in the database
   * and handle circular references gracefully
   */
  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const seen = new WeakSet();

    try {
      for (const [key, value] of Object.entries(obj)) {
        if (seen.has(value as object)) {
          sanitized[key] = '[Circular Reference]';
          continue;
        }

        if (value && typeof value === 'object') {
          seen.add(value as object);
        }

        sanitized[key] = this.sanitizeValue(value);
      }
    } catch (e) {
      console.warn('Error sanitizing object:', e);
      return { sanitizationError: 'Failed to sanitize object', originalKeys: Object.keys(obj) };
    }

    return sanitized;
  }

  /**
   * Sanitize individual values to ensure they are database-safe
   */
  private sanitizeValue(value: unknown): unknown {
    try {
      // Handle primitive types
      if (value === null || value === undefined) {
        return value;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }

      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle Error objects recursively
      if (value instanceof Error) {
        return this.serializeError(value);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map((item) => this.sanitizeValue(item));
      }

      // Handle plain objects
      if (value && typeof value === 'object') {
        return this.sanitizeObject(value as Record<string, unknown>);
      }

      // Handle Buffer objects (common in Node.js)
      if (Buffer.isBuffer(value)) {
        return {
          type: 'Buffer',
          length: value.length,
          preview: value.toString('hex').substring(0, 100) + (value.length > 50 ? '...' : ''),
        };
      }

      // Handle Map objects
      if (value instanceof Map) {
        return {
          type: 'Map',
          size: value.size,
          entries: Array.from(value.entries()).map(([k, v]) => [
            this.sanitizeValue(k),
            this.sanitizeValue(v),
          ]),
        };
      }

      // Handle Set objects
      if (value instanceof Set) {
        return {
          type: 'Set',
          size: value.size,
          values: Array.from(value.values()).map((v) => this.sanitizeValue(v)),
        };
      }

      // For other types, convert to string
      return String(value);
    } catch (e) {
      console.warn('Error sanitizing value:', e);
      return `[Unserializable: ${typeof value}]`;
    }
  }

  public async logTransaction(log: TransactionLog) {
    this.logToConsole(log);
    await this.logToDatabase(log);
    // TODO: In production, send to logging service (e.g., CloudWatch, DataDog)
  }

  public async logBlockchainOperation(operation: string, details: unknown) {
    const log: TransactionLog = {
      timestamp: new Date().toISOString(),
      operation,
      status: 'started',
      details,
    };
    await this.logTransaction(log);
    return log;
  }

  public async logBlockchainSuccess(log: TransactionLog, result: unknown) {
    const successLog: TransactionLog = {
      ...log,
      status: 'completed',
      details: {
        ...(log.details as Record<string, unknown>),
        result: this.sanitizeValue(result),
        completedAt: new Date().toISOString(),
      },
    };
    await this.logTransaction(successLog);
  }

  public async logBlockchainError(operation: string, error: unknown) {
    const errorLog: TransactionLog = {
      timestamp: new Date().toISOString(),
      operation,
      status: 'failed',
      error,
    };
    await this.logTransaction(errorLog);
  }
}

export const loggingService = new LoggingService();
