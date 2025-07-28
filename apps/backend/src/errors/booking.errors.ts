// Custom error classes for booking operations
export class BookingNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingNotFoundError';
  }
}

export class BookingStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingStatusError';
  }
}

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionValidationError';
  }
}

export class BookingPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingPermissionError';
  }
}
