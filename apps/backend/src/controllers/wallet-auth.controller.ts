import type { Request, Response } from 'express';
import { authenticateWallet as walletAuthentication } from '../services/wallet-auth.services';
import { generateChallenge as walletChallengeGenerator } from '../services/wallet-challenge.service';
import type { ChallengeRequest, WalletLoginRequest } from '../types/wallet-auth.types';

export const generateChallenge = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body as ChallengeRequest;

    const challengeResponse = await walletChallengeGenerator(publicKey);

    res.status(200).json(challengeResponse);
  } catch (error) {
    console.error('Challenge generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const authenticateWallet = async (req: Request, res: Response) => {
  try {
    const walletLoginData = req.body as WalletLoginRequest;

    const authResponse = await walletAuthentication(walletLoginData);

    //===================
    // Set secure HTTP-only cookie with JWT
    //===================
    res.cookie('auth-token', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: authResponse.user,
      token: authResponse.token,
    });
  } catch (error) {
    console.error('Wallet authentication error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('Invalid public key')) {
      return res.status(400).json({ error: 'Invalid public key format' });
    }

    if (message.includes('Invalid or expired challenge')) {
      return res.status(401).json({ error: 'Challenge has expired or is invalid' });
    }

    if (message.includes('Invalid signature')) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    res.status(500).json({ error: message });
  }
};
