import type { Request, Response } from 'express';
import { authenticateWallet } from '../services/wallet-auth.service';
import { generateChallenge as generateWalletChallenge } from '../services/wallet-challenge.service';
import type { ChallengeRequest, WalletLoginRequest } from '../types/wallet-auth.types';
import {
  ConnectionRejectedError,
  InvalidChallengeError,
  InvalidPublicKeyError,
  SignatureVerificationError,
  WalletNotFoundError,
} from '../types/wallet-error-types';

//===================
// Generate challenge for wallet authentication
//===================
export const generateChallenge = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body as ChallengeRequest;

    const challengeResponse = await generateWalletChallenge(publicKey);

    res.status(200).json(challengeResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

//===================
// Authenticate wallet with signed transaction
//===================
export const authenticateWalletController = async (req: Request, res: Response) => {
  try {
    const walletLoginData = req.body as WalletLoginRequest;

    if (!walletLoginData.publicKey) {
      return res.status(400).json({ error: 'Missing publicKey' });
    }
    if (!walletLoginData.signedTransaction) {
      return res.status(400).json({ error: 'Missing signedTransaction' });
    }
    if (!walletLoginData.challenge) {
      return res.status(400).json({ error: 'Missing challenge' });
    }

    const authResponse = await authenticateWallet(walletLoginData);

    res.cookie('auth-token', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('🎉 Wallet authentication successful for user:', authResponse.user.id);
    res.status(200).json({
      user: authResponse.user,
      token: authResponse.token,
    });
  } catch (error) {
    console.error('Wallet authentication error:', error);

    if (error instanceof InvalidPublicKeyError) {
      return res.status(400).json({ error: error.message, code: 'INVALID_PUBLIC_KEY' });
    }

    if (error instanceof InvalidChallengeError) {
      return res.status(401).json({ error: error.message, code: 'INVALID_CHALLENGE' });
    }

    if (error instanceof SignatureVerificationError) {
      return res.status(401).json({ error: error.message, code: 'SIGNATURE_VERIFICATION_FAILED' });
    }

    if (error instanceof WalletNotFoundError) {
      return res.status(400).json({ error: error.message, code: 'WALLET_NOT_FOUND' });
    }

    if (error instanceof ConnectionRejectedError) {
      return res.status(400).json({ error: error.message, code: 'CONNECTION_REJECTED' });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
  }
};
