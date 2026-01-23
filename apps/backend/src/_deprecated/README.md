# Deprecated Files

These files were deprecated as part of the migration to **Stellar Social SDK** for authentication.

## Why deprecated?

The previous authentication system used a challenge-response mechanism where:
1. Frontend requests a challenge from backend
2. User signs the challenge with Freighter wallet
3. Backend verifies the signature

This has been replaced with the **Stellar Account Abstraction SDK** which:
- Handles authentication entirely on the client-side
- Supports social login (Google, Facebook, Phone)
- Generates deterministic Stellar keypairs from social credentials
- No backend involvement needed for auth

## Moved Files

- `wallet-auth.controller.ts` - Express controller for wallet auth endpoints
- `wallet-auth.routes.ts` - Express routes for /api/auth/challenge and /api/auth/wallet
- `wallet-auth.service.ts` - Service for verifying signed transactions
- `wallet-challenge.service.ts` - Service for generating and managing challenges
- `wallet-auth.types.ts` - TypeScript types for wallet auth
- `wallet-auth.validator.ts` - Zod validators for wallet auth requests

## Can I delete these?

Yes, these files are no longer used and can be safely deleted once you're confident the new authentication system works correctly.

## Migration Date

2024 - Part of Issue: Replace login with Stellar-Account-Abstraction-SDK
