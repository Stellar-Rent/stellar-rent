import type { TransactionLog } from '../types/common.types';

class LoggingService {
  private logToConsole(log: TransactionLog) {
    console.log(JSON.stringify(log, null, 2));
  }

  public logTransaction(log: TransactionLog) {
    this.logToConsole(log);
    // TODO: In production, send to logging service (e.g., CloudWatch, DataDog)
  }

  public logBlockchainOperation(operation: string, details: unknown) {
    const log: TransactionLog = {
      timestamp: new Date().toISOString(),
      operation,
      status: 'started',
      details,
    };
    this.logTransaction(log);
    return log;
  }

  public logBlockchainSuccess(log: TransactionLog, result: unknown) {
    const successLog: TransactionLog = {
      ...log,
      status: 'completed',
      details: { ...(log.details as Record<string, unknown>), result },
    };
    this.logTransaction(successLog);
  }

  public logBlockchainError(log: TransactionLog, error: unknown) {
    const errorLog: TransactionLog = {
      ...log,
      status: 'failed',
      error,
    };
    this.logTransaction(errorLog);
  }
}

export const loggingService = new LoggingService();
