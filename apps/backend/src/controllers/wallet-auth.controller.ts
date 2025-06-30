import type { Request, Response } from 'express';
import { authenticateWallet } from '../services/wallet-auth.service';
import { generateChallenge as generateWalletChallenge } from '../services/wallet-challenge.service';
import type { ChallengeRequest, WalletLoginRequest } from '../types/wallet-auth.types';

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
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('Invalid public key')) {
      return res.status(400).json({ error: 'Invalid public key format' });
    }

    if (message.includes('Invalid or expired challenge')) {
      return res.status(401).json({ error: 'Challenge has expired or is invalid' });
    }

    if (message.includes('Invalid signed transaction')) {
      return res.status(401).json({ error: 'Transaction verification failed' });
    }

    res.status(500).json({ error: message });
  }
};
