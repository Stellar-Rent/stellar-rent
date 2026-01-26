// Import test setup first to configure environment variables
import '../setup';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { randomBytes } from 'node:crypto';
import {
  Account,
  BASE_FEE,
  Keypair,
  Memo,
  Networks,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import request from 'supertest';

// Import app after mock is set up
import { app } from '../../src/';
import { supabase } from '../../src/config/supabase';
import { authenticateWallet } from '../../src/_deprecated/wallet-auth.service';
import {
  cleanupAllExpiredChallenges,
  generateChallenge,
  getValidChallenge,
  removeChallenge,
} from '../../src/_deprecated/wallet-challenge.service';
import {
  ConnectionRejectedError,
  InvalidChallengeError,
  InvalidPublicKeyError,
  SignatureVerificationError,
  WalletNotFoundError,
} from '../../src/_deprecated/wallet-auth.types';

// Store original console methods
let originalConsoleLog: typeof console.log;
let originalConsoleError: typeof console.error;

describe('Wallet Authentication System', () => {
  // Suppress console output during tests
  beforeAll(() => {
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = () => {}; // Suppress console.log
    console.error = () => {}; // Suppress console.error
  });

  afterAll(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Wallet Challenge Service', () => {
    let testKeypair: Keypair;
    let testPublicKey: string;

    beforeEach(() => {
      testKeypair = Keypair.random();
      testPublicKey = testKeypair.publicKey();
    });

    afterEach(async () => {
      await supabase.from('wallet_challenges').delete().eq('public_key', testPublicKey);
    });

    describe('generateChallenge', () => {
      it('should generate a unique challenge for a public key', async () => {
        const result = await generateChallenge(testPublicKey);

        expect(result.challenge).toBeDefined();
        expect(result.expiresAt).toBeDefined();
        expect(result.challenge).toMatch(/^[a-f0-9]{24}$/);

        const storedChallenge = await getValidChallenge(testPublicKey, result.challenge);
        expect(storedChallenge).toBeTruthy();
      });

      it('should reuse existing valid challenge', async () => {
        const firstChallenge = await generateChallenge(testPublicKey);
        const secondChallenge = await generateChallenge(testPublicKey);

        expect(firstChallenge.challenge).toBe(secondChallenge.challenge);
        expect(new Date(firstChallenge.expiresAt).getTime()).toBeCloseTo(
          new Date(secondChallenge.expiresAt).getTime(),
          -1000
        );
      });

      it('should generate new challenge after expiration', async () => {
        const expiredChallenge = randomBytes(12).toString('hex');
        const pastTime = new Date(Date.now() - 10 * 60 * 1000);

        await supabase.from('wallet_challenges').insert({
          public_key: testPublicKey,
          challenge: expiredChallenge,
          expires_at: pastTime.toISOString(),
        });

        const newChallenge = await generateChallenge(testPublicKey);
        expect(newChallenge.challenge).not.toBe(expiredChallenge);
      });
    });

    describe('getValidChallenge', () => {
      it('should return valid challenge', async () => {
        const generated = await generateChallenge(testPublicKey);
        const retrieved = await getValidChallenge(testPublicKey, generated.challenge);

        expect(retrieved).toBeTruthy();
        if (retrieved) {
          expect(retrieved.challenge).toBe(generated.challenge);
        }
      });

      it('should return null for expired challenge', async () => {
        const expiredChallenge = randomBytes(12).toString('hex');
        const pastTime = new Date(Date.now() - 10 * 60 * 1000);

        await supabase.from('wallet_challenges').insert({
          public_key: testPublicKey,
          challenge: expiredChallenge,
          expires_at: pastTime.toISOString(),
        });

        const result = await getValidChallenge(testPublicKey, expiredChallenge);
        expect(result).toBeNull();
      });

      it('should return null for non-existent challenge', async () => {
        const result = await getValidChallenge(testPublicKey, 'non-existent-challenge');
        expect(result).toBeNull();
      });
    });

    describe('removeChallenge', () => {
      it('should remove challenge after use', async () => {
        const generated = await generateChallenge(testPublicKey);
        const stored = await getValidChallenge(testPublicKey, generated.challenge);

        if (stored) {
          await removeChallenge(stored.id);
        }

        const afterRemoval = await getValidChallenge(testPublicKey, generated.challenge);
        expect(afterRemoval).toBeNull();
      });
    });

    describe('cleanupAllExpiredChallenges', () => {
      it('should clean up expired challenges', async () => {
        const expiredChallenge = randomBytes(12).toString('hex');
        const pastTime = new Date(Date.now() - 10 * 60 * 1000);

        await supabase.from('wallet_challenges').insert({
          public_key: testPublicKey,
          challenge: expiredChallenge,
          expires_at: pastTime.toISOString(),
        });

        const validKeypair = Keypair.random();
        const validPublicKey = validKeypair.publicKey();
        const validChallenge = await generateChallenge(validPublicKey);

        await cleanupAllExpiredChallenges();

        const expiredResult = await getValidChallenge(testPublicKey, expiredChallenge);
        expect(expiredResult).toBeNull();

        const validResult = await getValidChallenge(validPublicKey, validChallenge.challenge);
        expect(validResult).toBeTruthy();

        await supabase.from('wallet_challenges').delete().eq('public_key', validPublicKey);
      });
    });
  });

  describe('Wallet Auth Service', () => {
    let testKeypair: Keypair;
    let testPublicKey: string;

    beforeEach(() => {
      testKeypair = Keypair.random();
      testPublicKey = testKeypair.publicKey();
    });

    afterEach(async () => {
      await supabase.from('wallet_challenges').delete().eq('public_key', testPublicKey);
      await supabase.from('wallet_users').delete().eq('public_key', testPublicKey);
    });

    const createTestTransaction = (keypair: Keypair, memo: string) => {
      const account = new Account(keypair.publicKey(), '0');
      return new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addMemo(Memo.text(memo))
        .setTimeout(30)
        .build();
    };

    describe('authenticateWallet', () => {
      it('should authenticate wallet with valid signature', async () => {
        const challengeResponse = await generateChallenge(testPublicKey);
        const transaction = createTestTransaction(testKeypair, challengeResponse.challenge);
        transaction.sign(testKeypair);

        const result = await authenticateWallet({
          publicKey: testPublicKey,
          signedTransaction: transaction.toXDR(),
          challenge: challengeResponse.challenge,
        });

        expect(result.token).toBeDefined();
        expect(result.user.id).toBeDefined();
        expect(result.user.publicKey).toBe(testPublicKey);
      });

      it('should throw InvalidPublicKeyError for invalid public key', async () => {
        await expect(async () => {
          await authenticateWallet({
            publicKey: 'invalid-public-key',
            signedTransaction: 'some-transaction',
            challenge: 'some-challenge',
          });
        }).toThrow(InvalidPublicKeyError);
      });

      it('should throw InvalidChallengeError for expired challenge', async () => {
        await expect(async () => {
          await authenticateWallet({
            publicKey: testPublicKey,
            signedTransaction: 'some-transaction',
            challenge: 'expired-challenge',
          });
        }).toThrow(InvalidChallengeError);
      });

      it('should throw SignatureVerificationError for invalid signature', async () => {
        const challengeResponse = await generateChallenge(testPublicKey);
        const transaction = createTestTransaction(testKeypair, 'wrong-memo');
        transaction.sign(testKeypair);

        await expect(async () => {
          await authenticateWallet({
            publicKey: testPublicKey,
            signedTransaction: transaction.toXDR(),
            challenge: challengeResponse.challenge,
          });
        }).toThrow(SignatureVerificationError);
      });

      it('should create new wallet user if not exists', async () => {
        const challengeResponse = await generateChallenge(testPublicKey);
        const transaction = createTestTransaction(testKeypair, challengeResponse.challenge);
        transaction.sign(testKeypair);

        const result = await authenticateWallet({
          publicKey: testPublicKey,
          signedTransaction: transaction.toXDR(),
          challenge: challengeResponse.challenge,
        });

        const { data: walletUser } = await supabase
          .from('wallet_users')
          .select('*')
          .eq('public_key', testPublicKey)
          .single();

        expect(walletUser).toBeTruthy();
        if (walletUser) {
          expect(walletUser.id).toBe(result.user.id);
        }
      });

      it('should reuse existing wallet user', async () => {
        const { data: existingUser } = await supabase
          .from('wallet_users')
          .insert({ public_key: testPublicKey })
          .select()
          .single();

        const challengeResponse = await generateChallenge(testPublicKey);
        const transaction = createTestTransaction(testKeypair, challengeResponse.challenge);
        transaction.sign(testKeypair);

        const result = await authenticateWallet({
          publicKey: testPublicKey,
          signedTransaction: transaction.toXDR(),
          challenge: challengeResponse.challenge,
        });

        expect(result.user.id).toBe(existingUser?.id);
      });
    });
  });

  describe('Wallet Auth API Endpoints', () => {
    let testKeypair: Keypair;
    let testPublicKey: string;

    beforeEach(() => {
      testKeypair = Keypair.random();
      testPublicKey = testKeypair.publicKey();
    });

    afterEach(async () => {
      await supabase.from('wallet_challenges').delete().eq('public_key', testPublicKey);
      await supabase.from('wallet_users').delete().eq('public_key', testPublicKey);
    });

    const createTestTransaction = (keypair: Keypair, memo: string) => {
      const account = new Account(keypair.publicKey(), '0');
      return new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addMemo(Memo.text(memo))
        .setTimeout(30)
        .build();
    };

    describe('POST /api/auth/challenge', () => {
      it('should generate challenge successfully', async () => {
        const response = await request(app)
          .post('/api/auth/challenge')
          .send({ publicKey: testPublicKey })
          .expect(200);

        expect(response.body.challenge).toBeDefined();
        expect(response.body.expiresAt).toBeDefined();
      });

      it('should return 400 for invalid public key', async () => {
        const response = await request(app)
          .post('/api/auth/challenge')
          .send({ publicKey: '' })
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/wallet', () => {
      it('should authenticate wallet successfully', async () => {
        const challengeResponse = await request(app)
          .post('/api/auth/challenge')
          .send({ publicKey: testPublicKey })
          .expect(200);

        const transaction = createTestTransaction(testKeypair, challengeResponse.body.challenge);
        transaction.sign(testKeypair);

        const response = await request(app)
          .post('/api/auth/wallet')
          .send({
            publicKey: testPublicKey,
            signedTransaction: transaction.toXDR(),
            challenge: challengeResponse.body.challenge,
          })
          .expect(200);

        expect(response.body.token).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.publicKey).toBe(testPublicKey);

        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.some((cookie: string) => cookie.includes('auth-token'))).toBe(true);
      });

      it('should return 400 for missing fields', async () => {
        const response = await request(app)
          .post('/api/auth/wallet')
          .send({
            publicKey: testPublicKey,
          })
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should return 401 for invalid challenge', async () => {
        const transaction = createTestTransaction(testKeypair, 'invalid-challenge');
        transaction.sign(testKeypair);

        const response = await request(app)
          .post('/api/auth/wallet')
          .send({
            publicKey: testPublicKey,
            signedTransaction: transaction.toXDR(),
            challenge: 'invalid-challenge',
          })
          .expect(401);

        expect(response.body.error).toBeDefined();
        expect(response.body.code).toBe('INVALID_CHALLENGE');
      });

      it('should return 401 for signature verification failure', async () => {
        const challengeResponse = await request(app)
          .post('/api/auth/challenge')
          .send({ publicKey: testPublicKey })
          .expect(200);

        const transaction = createTestTransaction(testKeypair, 'wrong-memo');
        transaction.sign(testKeypair);

        const response = await request(app)
          .post('/api/auth/wallet')
          .send({
            publicKey: testPublicKey,
            signedTransaction: transaction.toXDR(),
            challenge: challengeResponse.body.challenge,
          })
          .expect(401);

        expect(response.body.error).toBeDefined();
        expect(response.body.code).toBe('SIGNATURE_VERIFICATION_FAILED');
      });
    });
  });

  describe('Error Types', () => {
    it('should create proper error instances', () => {
      const walletNotFoundError = new WalletNotFoundError();
      expect(walletNotFoundError.name).toBe('WalletNotFoundError');
      expect(walletNotFoundError.message).toBe('Wallet not found or not installed');

      const connectionRejectedError = new ConnectionRejectedError();
      expect(connectionRejectedError.name).toBe('ConnectionRejectedError');
      expect(connectionRejectedError.message).toBe('User rejected wallet connection');

      const invalidChallengeError = new InvalidChallengeError();
      expect(invalidChallengeError.name).toBe('InvalidChallengeError');
      expect(invalidChallengeError.message).toBe('Invalid or expired challenge');

      const signatureVerificationError = new SignatureVerificationError();
      expect(signatureVerificationError.name).toBe('SignatureVerificationError');
      expect(signatureVerificationError.message).toBe('Signature verification failed');

      const invalidPublicKeyError = new InvalidPublicKeyError();
      expect(invalidPublicKeyError.name).toBe('InvalidPublicKeyError');
      expect(invalidPublicKeyError.message).toBe('Invalid public key format');
    });

    it('should accept custom error messages', () => {
      const customError = new InvalidPublicKeyError('Custom error message');
      expect(customError.message).toBe('Custom error message');
    });
  });
});
