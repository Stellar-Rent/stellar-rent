export class WalletNotFoundError extends Error {
  constructor(message = 'Wallet not found or not installed') {
    super(message);
    this.name = 'WalletNotFoundError';
  }
}

export class ConnectionRejectedError extends Error {
  constructor(message = 'User rejected wallet connection') {
    super(message);
    this.name = 'ConnectionRejectedError';
  }
}

export class InvalidChallengeError extends Error {
  constructor(message = 'Invalid or expired challenge') {
    super(message);
    this.name = 'InvalidChallengeError';
  }
}

export class SignatureVerificationError extends Error {
  constructor(message = 'Signature verification failed') {
    super(message);
    this.name = 'SignatureVerificationError';
  }
}

export class InvalidPublicKeyError extends Error {
  constructor(message = 'Invalid public key format') {
    super(message);
    this.name = 'InvalidPublicKeyError';
  }
}
