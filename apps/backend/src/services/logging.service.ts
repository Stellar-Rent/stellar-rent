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
        data: log.details as Record<string, unknown>,
        error_details: log.error as Record<string, unknown>,
        created_at: log.timestamp,
      });
    } catch (error) {
      console.error('Failed to log to database:', error);
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
      details: { ...(log.details as Record<string, unknown>), result },
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
